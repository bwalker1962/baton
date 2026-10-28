import Link from "next/link";

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="brand" aria-label="Baton" style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none", color: "var(--text)" }}>
          <span className="brand-mark">B</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Baton</span>
        </Link>
        {children}
        <p className="xs muted" style={{ margin: "8px 0 0", textAlign: "center" }}>© 2026 RidgeFront · Prototype: no real accounts</p>
      </div>
    </main>
  );
}

/** Face ID / Touch ID / Windows Hello all arrive through passkeys (WebAuthn). */
export function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M9 9v1M15 9v1M12 9v4h-1M9.5 16a4 4 0 0 0 5 0" />
    </svg>
  );
}
