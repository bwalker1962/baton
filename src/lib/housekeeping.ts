// Housekeeping: rename, archive, delete. Archive hides without losing; delete moves an item
// to Trash for 30 days, then it is purged. Every archive, delete and restore is logged.
// Nothing here touches the outside world: deleting a file removes Baton's copy or link only.
// © 2026 RidgeFront. All rights reserved.

export type HKKind = "workspace" | "project" | "task" | "note" | "chat" | "file";

/** What a housekeeping action points at. */
export interface Ref {
  kind: HKKind;
  id: string;
  name: string;
  clientId?: string;
}

export interface TrashEntry extends Ref {
  key: string;
  deletedAt: string; // ISO date-time
  radius?: string; // what went with it, in words
}

export type HKAction = "archived" | "unarchived" | "deleted" | "restored" | "deleted forever" | "purged after 30 days" | "renamed";

export interface Activity {
  id: string;
  at: string; // ISO date-time
  who: string;
  action: HKAction;
  kind: HKKind;
  name: string;
  clientId?: string;
  detail?: string;
}

export interface HKState {
  archived: Record<string, string>; // key → ISO date archived
  trash: TrashEntry[];
  purged: string[];
  activity: Activity[];
  renames: Record<string, string>; // key → new name, for items Baton doesn't own the data of
}

export const HK_EMPTY: HKState = { archived: {}, trash: [], purged: [], activity: [] , renames: {} };
export const HK_STORAGE = "baton-housekeeping-v1";
export const TRASH_DAYS = 30;
/** The prototype has one user. A real build takes this from the signed-in account. */
export const ME = "Brett Walker";

export const keyOf = (kind: HKKind, id: string) => `${kind}:${id}`;

export const KIND_LABEL: Record<HKKind, string> = {
  workspace: "Client workspace",
  project: "Project",
  task: "Task",
  note: "Note",
  chat: "Chat",
  file: "File",
};

/** Small things delete at once with an undo toast; the rest confirm first. */
export const UNDO_KINDS: HKKind[] = ["task", "note"];

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "4 programs, 37 tasks, 12 files, 9 chats", leaving out the zeros. */
export function radiusText(parts: [number, string, string?][]): string {
  const shown = parts.filter(([n]) => n > 0).map(([n, one, many]) => plural(n, one, many));
  return shown.length ? shown.join(", ") : "Nothing else goes with it";
}

export function daysLeft(deletedAt: string, now = Date.now()): number {
  const gone = new Date(deletedAt).getTime() + TRASH_DAYS * 86_400_000;
  return Math.max(0, Math.ceil((gone - now) / 86_400_000));
}

export const aid = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Download a JSON file of whatever the browser holds. No server involved. */
export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
