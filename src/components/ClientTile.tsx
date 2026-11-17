"use client";
import { useClientLook } from "@/lib/store";
import type { Client } from "@/lib/types";
import { useState } from "react";

const faviconHosts: Record<string, string> = {
  "morning-miracle": "drinkmorningmiracle.com",
  pentara: "pentara.com",
  photopharmics: "photopharmics.com",
  "mountain-peaks": "mountainpeaksfamilypractice.com",
};

/** Client logo tile: uses the brand chosen in Baton, falling back to the defaults. */
export function ClientTile({ client, small, size }: { client: Pick<Client, "id" | "color" | "initial" | "name">; small?: boolean; size?: number }) {
  const look = useClientLook(client);
  const [iconFailed, setIconFailed] = useState(false);
  const host = faviconHosts[client.id];
  const style: React.CSSProperties = { background: look.color };
  if (size) Object.assign(style, { width: size, height: size, borderRadius: size / 4, fontSize: size * 0.42 });
  return (
    <span className={`tile ${small ? "tile-sm" : ""}`} style={style} aria-hidden="true">
      {look.logo === "monogram" && host && !iconFailed ? <img src={`https://${host}/favicon.ico`} alt="" width={size ? Math.round(size * .65) : 18} height={size ? Math.round(size * .65) : 18} style={{ objectFit: "contain" }} onError={() => setIconFailed(true)} /> : look.logo !== "monogram" ? <LogoMark /> : look.initial}
    </span>
  );
}

/** Stand-in for a fetched logo image in the prototype. */
function LogoMark() {
  return (
    <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M4 18L10 8l4 6 2-3 4 7z" />
    </svg>
  );
}
