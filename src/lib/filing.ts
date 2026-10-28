// Filing dropped documents: which client, and what kind of file.
// File only when it's obvious; otherwise ask. The build reads PDFs and Word files too
// and lets Claude judge; the prototype reads names and plain-text content.
// © 2026 RidgeFront. All rights reserved.
import { clients } from "./data";

// Words that point to a client. Full names only for common words ("morning", "mountain").
const CUES: Record<string, string[]> = {
  pentara: ["pentara"],
  "morning-miracle": ["morning miracle", "morningmiracle", "morning-miracle"],
  photopharmics: ["photopharmics", "photo pharmics"],
  "mountain-peaks": ["mountain peaks", "mountainpeaks", "mountain-peaks"],
};

export interface Verdict {
  clientId?: string; // filed without asking when set and sure
  sure: boolean;
  suggest?: string; // preselected answer when asking
  reason: string; // shown when asking
  hits: Record<string, number>;
}

const count = (hay: string, cue: string) => hay.split(cue).length - 1;

export function classify(name: string, text: string, here?: string): Verdict {
  const hay = `${name.toLowerCase().replace(/[_]+/g, " ")}\n${text.toLowerCase()}`;
  const hits: Record<string, number> = {};
  for (const c of clients) {
    // A name in the filename counts more than one mention deep in the text.
    const inName = CUES[c.id].reduce((n, cue) => n + count(name.toLowerCase().replace(/[_]+/g, " "), cue), 0);
    const n = CUES[c.id].reduce((t, cue) => t + count(hay, cue), 0) + inName * 2;
    if (n) hits[c.id] = n;
  }
  const ranked = Object.entries(hits).sort((a, b) => b[1] - a[1]);
  const nameOf = (id?: string) => clients.find((c) => c.id === id)?.name ?? "";
  const [top, second] = ranked;

  if (!top) {
    return here
      ? { sure: false, suggest: here, reason: `No client is named in it. You dropped it in ${nameOf(here)}; is that where it goes?`, hits }
      : { sure: false, reason: "No client is named in it.", hits };
  }
  const clear = !second || top[1] >= second[1] * 3;
  // Mixed mentions: no preselection, so the choice is deliberate.
  if (!clear) return { sure: false, reason: `It mentions ${ranked.map(([id]) => nameOf(id)).join(" and ")}. Pick one.`, hits };
  if (here && top[0] !== here) return { sure: false, suggest: top[0], reason: `It's about ${nameOf(top[0])}, but you dropped it in ${nameOf(here)}.`, hits };
  return { clientId: top[0], sure: true, reason: `Mentions ${nameOf(top[0])}`, hits };
}

export const KINDS = ["Brand guide", "Logo", "Brief", "Report", "Contract", "Meeting notes", "Document"] as const;

export function kindOf(name: string, type: string): string {
  const n = name.toLowerCase();
  if (/brand|style ?guide|guidelines/.test(n)) return "Brand guide";
  if (/logo/.test(n) || (type.startsWith("image/") && /mark|icon/.test(n))) return "Logo";
  if (/brief/.test(n)) return "Brief";
  if (/report|results|analytics/.test(n)) return "Report";
  if (/contract|sow|agreement|msa|nda/.test(n)) return "Contract";
  if (/notes|minutes|meeting/.test(n)) return "Meeting notes";
  return "Document";
}

/** Text Baton can read in the prototype; everything else is judged by name only. */
export const readable = (f: File) => f.size < 500_000 && (/^text\//.test(f.type) || /\.(md|txt|csv|html?|json)$/i.test(f.name));

/** Never file what looks like a password list; logins belong in the vault. */
export const looksSecret = (name: string, text: string) => /password|passwd|credentials?\b|api[_ -]?key/i.test(`${name}\n${text.slice(0, 5000)}`);
