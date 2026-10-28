"use client";
import Link from "next/link";
import { StartProjectPill } from "@/components/ProjectStarter";
import { Dashboard } from "@/components/Dashboard";
import { DEFAULT_HOME } from "@/components/Widgets";
import { useStore } from "@/lib/store";
import { owedToCeos } from "@/lib/ceo";
import { Icon } from "@/components/Icon";

export default function Home() {
  const { items, tasks } = useStore();
  const needs = items.filter((i) => i.state === "needs");
  const late = owedToCeos(tasks).filter((o) => o.late).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Wednesday, October 28</div>
          <h1 className="title">Good morning, Brett</h1>
          <div className="muted small" style={{ marginTop: 4 }}>
            {late ? `${late} promise${late > 1 ? "s" : ""} to a CEO ${late > 1 ? "are" : "is"} late.` : "Every promise to a CEO is on time."}{" "}
            {needs.length ? `${needs.length} item${needs.length > 1 ? "s" : ""} need${needs.length === 1 ? "s" : ""} your eyes.` : "Nothing needs your eyes."}
          </div>
        </div>
        {needs.length > 0 && <Link href="/signoff" className="btn btn-primary btn-lg"><Icon name="eye" />Start sign-off · {needs.length}</Link>}
      </div>
      <StartProjectPill />
      <Dashboard storageKey="baton-dash-home-v2" scope="home" defaults={DEFAULT_HOME} />
    </div>
  );
}
