"use client";
// A client workspace that is archived shows a banner; one in Trash or deleted shows only that.
import Link from "next/link";
import { useStore } from "@/lib/store";
import { keyOf } from "@/lib/housekeeping";
import { Icon } from "./Icon";

export function WorkspaceGate({ id, name, children }: { id: string; name: string; children: React.ReactNode }) {
  const { workspaceState, unarchive, restore, hk } = useStore();
  const state = workspaceState(id);
  const ref = { kind: "workspace" as const, id, name, clientId: id };
  if (state === "trashed" || state === "purged") {
    const left = hk.trash.find((t) => t.key === keyOf("workspace", id));
    return (
      <section className="card empty">
        <Icon name="empty" />
        <h3>{state === "trashed" ? `${name} is in Trash` : `${name} was deleted`}</h3>
        <p>{state === "trashed" ? "Restore it to bring back its projects, tasks, notes, chats and files." : "It was deleted for good. Its sign-off records are still in the activity log."}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {state === "trashed" && left && <button className="btn btn-primary" onClick={() => restore([left.key])}>Restore {name}</button>}
          <Link className="btn" href="/settings">Open Trash</Link>
        </div>
      </section>
    );
  }
  return (
    <>
      {state === "archived" && (
        <div className="hk-banner" role="status">
          <Icon name="layers" size={16} />
          <span className="grow small"><strong>{name} is archived.</strong> It is off Home, Today and search, and nothing new goes out from it. Everything is kept.</span>
          <button className="btn" onClick={() => unarchive([ref])}>Unarchive</button>
        </div>
      )}
      {children}
    </>
  );
}
