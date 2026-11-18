"use client";
// Client logo tile: the brand chosen in Baton, falling back to a monogram.
//
// This used to fetch https://{client-domain}/favicon.ico for each tile, which
// meant opening a task list pinged every client's web server from your IP, and
// a failed fetch left a broken-image glyph permanently: the <img> is in the
// server-rendered HTML, so the browser can finish loading (and failing) before
// React hydrates and attaches onError, and the fallback never runs.
//
// The monogram is what the sidebar already uses, works offline, and tells
// nobody outside this machine that you opened the app.
// © 2026 RidgeFront. All rights reserved.
import { useClientLook } from "@/lib/store";
import type { Client } from "@/lib/types";

export function ClientTile({ client, small, size }: { client: Pick<Client, "id" | "color" | "initial" | "name">; small?: boolean; size?: number }) {
  const look = useClientLook(client);
  const style: React.CSSProperties = { background: look.color };
  if (size) Object.assign(style, { width: size, height: size, borderRadius: size / 4, fontSize: size * 0.42 });
  return (
    <span className={`tile ${small ? "tile-sm" : ""}`} style={style} aria-hidden="true">
      {look.logo === "monogram" ? look.initial : <LogoMark />}
    </span>
  );
}

/** Stand-in for a logo the user picked in Brand settings. */
function LogoMark() {
  return (
    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M4 18L10 8l4 6 2-3 4 7z" />
    </svg>
  );
}
