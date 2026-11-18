"use client";
// The Spaces a user works in: the built-in ones plus any they add.
// Lives in lib, not in the Spaces route, so components can read Spaces
// without importing a page module.
// © 2026 RidgeFront. All rights reserved.
import { clients } from "./data";
import { useStore, type Space } from "./store";

export const defaultSpaces: Space[] = [
  { id: "personal", name: "Personal", kind: "personal", color: "#64748b" },
  { id: "ridgefront", name: "RidgeFront", kind: "business", color: "#334155" },
  ...clients.map((c) => ({
    id: c.id,
    name: c.name,
    kind: "client" as const,
    color: c.color,
    website: c.website,
  })),
];

/** Built-in Spaces with the user's edits applied, followed by Spaces they created. */
export function useSpaces(): Space[] {
  const { spaces } = useStore();
  return [
    ...defaultSpaces.map((d) => ({ ...d, ...spaces.find((s) => s.id === d.id) })),
    ...spaces.filter((s) => !defaultSpaces.some((d) => d.id === s.id)),
  ];
}
