"use client";
import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/AuthFrame";

export default function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <AuthFrame>
      <h1>Reset your password</h1>
      {sent ? (
        <div className="card" style={{ padding: 16 }} role="status">
          <strong>Check your email</strong>
          <p className="small muted" style={{ margin: "6px 0 0" }}>If that address has an account, a reset link is on its way. It works for 30 minutes, once.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <label className="field">Email
            <input className="input" type="email" autoComplete="email" required />
          </label>
          <button className="btn btn-primary btn-lg" type="submit">Send reset link</button>
        </form>
      )}
      <p className="small" style={{ margin: 0, textAlign: "center" }}><Link href="/login">Back to sign in</Link></p>
    </AuthFrame>
  );
}
