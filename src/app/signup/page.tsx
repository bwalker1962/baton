"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame, PasskeyIcon } from "@/components/AuthFrame";

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");

  if (step === 2) {
    return (
      <AuthFrame>
        <h1>Turn on Face ID</h1>
        <p className="small muted" style={{ margin: 0 }}>
          Approving work from your phone should take one glance, not a password. Save a passkey on this device and you&apos;ll sign in with Face ID, Touch ID or Windows Hello.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => router.push("/")}><PasskeyIcon />Save a passkey</button>
        <button className="btn" style={{ border: 0, background: "none" }} onClick={() => router.push("/")}>Not now</button>
        <p className="xs muted" style={{ margin: 0 }}>You can add more devices later in Settings. Passkeys sync through iCloud Keychain or Google Password Manager.</p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <h1>Create your Baton account</h1>
      <button className="btn btn-outline btn-lg" onClick={() => setStep(2)}>
        <span aria-hidden="true" style={{ fontWeight: 700 }}>G</span>Sign up with Google
      </button>
      <div className="auth-or">or</div>
      <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
        <label className="field">Your name
          <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">Work email
          <input className="input" type="email" autoComplete="email" required />
        </label>
        <label className="field">Firm name
          <input className="input" autoComplete="organization" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="e.g. RidgeFront" required />
          <span className="xs muted" style={{ fontWeight: 400 }}>Your clients live under your firm. Invite teammates later.</span>
        </label>
        <label className="field">Password
          <input className="input" type="password" autoComplete="new-password" minLength={12} required />
          <span className="xs muted" style={{ fontWeight: 400 }}>12 characters or more. Or skip passwords and use a passkey next.</span>
        </label>
        <button className="btn btn-primary btn-lg" type="submit">Create account</button>
      </form>
      <p className="xs muted" style={{ margin: 0 }}>By creating an account you agree to the Terms and Privacy Policy.</p>
      <p className="small" style={{ margin: 0, textAlign: "center" }}>Already have an account? <Link href="/login">Sign in</Link></p>
    </AuthFrame>
  );
}
