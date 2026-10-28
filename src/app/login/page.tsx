"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame, PasskeyIcon } from "@/components/AuthFrame";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("brett@ridgefront.co");
  const [remember, setRemember] = useState(true);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = () => { setBusy(true); setTimeout(() => router.push("/"), 600); };

  return (
    <AuthFrame>
      <h1>Welcome back</h1>

      <button className="btn btn-primary btn-lg" onClick={go} disabled={busy}>
        <PasskeyIcon />{busy ? "Checking…" : "Sign in with Face ID or passkey"}
      </button>
      <p className="xs muted" style={{ margin: 0 }}>Uses your phone&apos;s Face ID, your Mac&apos;s Touch ID or Windows Hello. No password to remember.</p>

      <div className="auth-or">or</div>

      {sent ? (
        <div className="card" style={{ padding: 16 }} role="status">
          <strong>Check your email</strong>
          <p className="small muted" style={{ margin: "6px 0 0" }}>We sent a one-time sign-in link to {email}. It works for 15 minutes.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (mode === "link") setSent(true); else go(); }}>
          <label className="field">Email
            <input className="input" type="email" autoComplete="username webauthn" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          {mode === "password" && (
            <label className="field">
              <span style={{ display: "flex", justifyContent: "space-between" }}>Password <Link href="/forgot" className="xs" style={{ fontWeight: 500 }}>Forgot?</Link></span>
              <input className="input" type="password" autoComplete="current-password" defaultValue="••••••••••" required />
            </label>
          )}
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me on this device<br /><span className="xs muted">Stay signed in for 30 days. Leave off on shared computers.</span></span>
          </label>
          <button className="btn btn-outline btn-lg" type="submit" disabled={busy}>{mode === "password" ? "Sign in" : "Email me a sign-in link"}</button>
          <button type="button" className="btn" style={{ border: 0, background: "none" }} onClick={() => setMode(mode === "password" ? "link" : "password")}>
            {mode === "password" ? "Email me a link instead" : "Use a password instead"}
          </button>
        </form>
      )}

      <button className="btn btn-outline" onClick={go}>
        <span aria-hidden="true" style={{ fontWeight: 700 }}>G</span>Continue with Google
      </button>

      <p className="small" style={{ margin: 0, textAlign: "center" }}>New to Baton? <Link href="/signup">Create an account</Link></p>
    </AuthFrame>
  );
}
