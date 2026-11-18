"use client";
import { useState } from "react";
import type { Client } from "@/lib/types";
import { useStore } from "@/lib/store";
import { activeClients } from "@/lib/data";
import type { Ref } from "@/lib/housekeeping";
import { ArchivedToggle, BulkBar, ItemMenu, keyFileId, SelectBox, useSelection } from "./Housekeeping";
import { CardHead } from "./ui";
import { Icon } from "./Icon";

interface FileRow { id: string; name: string; source: string; updated: string; isLogin?: boolean; doc?: boolean }

/** A client's pinned files and the documents dropped into Baton, with your names and archive state. */
export function useClientFiles(client: Client) {
  const { allDocs, isGone, isArchived, nameOf } = useStore();
  const rows: FileRow[] = [
    ...client.keyFiles.map((f) => { const id = keyFileId(client.id, f.label); return { id, name: nameOf("file", id, f.label), source: f.source, updated: f.updated, isLogin: f.isLogin }; }),
    ...allDocs.filter((d) => d.clientId === client.id).map((d) => ({ id: d.id, name: d.name, source: `Dropped in · ${d.kind}`, updated: d.added, doc: true })),
  ].filter((r) => !isGone("file", r.id));
  return { live: rows.filter((r) => !isArchived("file", r.id)), archived: rows.filter((r) => isArchived("file", r.id)) };
}

/** Quick-access files for a client, including documents dropped into Baton. */
export function KeyFiles({ client }: { client: Client }) {
  const { live } = useClientFiles(client);
  return (
    <section aria-label="Key files" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {live.map((f) => (
        <a key={f.id} href="#" className={`btn ${f.doc ? "fade" : ""}`} style={{ minHeight: 36, fontWeight: 500, borderStyle: f.doc ? "dashed" : undefined }} title={`${f.source} · updated ${f.updated}`}>
          <Icon name={f.isLogin ? "lock" : "file"} size={15} />{f.name}
          <span className="muted xs">{f.isLogin ? "vault" : f.doc ? "new" : f.source}</span>
        </a>
      ))}
      <span className="muted xs hide-mobile" style={{ marginLeft: 4 }}>Drop files anywhere to add them</span>
    </section>
  );
}

/** The Files card on Apps & files: rename, archive, move and delete. Delete removes Baton's link only. */
export function FilesCard({ client }: { client: Client }) {
  const { rename, renameDoc, moveDoc } = useStore();
  const { live, archived } = useClientFiles(client);
  const [showArchived, setShowArchived] = useState(false);
  const list = showArchived ? archived : live;
  const sel = useSelection(list.map((f) => f.id));
  const ref = (f: FileRow): Ref => ({ kind: "file", id: f.id, name: f.name, clientId: client.id });
  const moveTo = activeClients().filter((c) => c.id !== client.id).map((c) => ({ id: c.id, name: c.name }));
  const docsPicked = list.filter((f) => sel.has(f.id) && f.doc);
  return (
    <section className="card">
      <CardHead icon="file" title={showArchived ? "Archived files" : "Key files"} count={list.length}>
        <ArchivedToggle count={archived.length} on={showArchived} onChange={setShowArchived} />
        <button className="btn">+ Pin a file</button>
      </CardHead>
      {list.length > 1 && <label className="row small muted" style={{ gap: 8 }}><SelectBox checked={sel.all} onChange={sel.toggleAll} label="Select all files" />Select all</label>}
      <BulkBar refs={list.filter((f) => sel.has(f.id)).map(ref)} onClear={sel.clear} archived={showArchived}
        moveTo={docsPicked.length && docsPicked.length === sel.picked.length ? moveTo : undefined} onMove={(cid) => docsPicked.forEach((f) => moveDoc(f.id, cid))} />
      {list.length === 0 && <div className="row muted small">{showArchived ? "Nothing archived." : "No files pinned."}</div>}
      {list.map((f) => (
        <div className={`row ${showArchived ? "hk-archived" : ""}`} key={f.id}>
          <SelectBox checked={sel.has(f.id)} onChange={() => sel.toggle(f.id)} label={`Select ${f.name}`} />
          <Icon name={f.isLogin ? "lock" : "file"} />
          <span className="grow"><strong>{f.name}</strong><br /><span className="muted small">{f.source} · updated {f.updated}</span></span>
          {f.isLogin ? <span className="badge b-neutral hide-mobile">Opens in your password manager</span> : <a href="#" className="btn" style={{ minHeight: 34 }}>Open</a>}
          <ItemMenu item={ref(f)} compact onRename={(n) => (f.doc ? renameDoc(f.id, n) : rename("file", f.id, n))}
            moveTo={f.doc ? moveTo : undefined} onMove={f.doc ? (cid) => moveDoc(f.id, cid) : undefined} />
        </div>
      ))}
      <div className="row muted small">Baton never stores passwords. Login pins point to a vault item; skills never see credentials. Deleting a file here removes Baton&apos;s link only; the file stays where it lives.</div>
    </section>
  );
}
