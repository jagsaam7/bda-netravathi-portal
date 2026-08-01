"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ username:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { ...form, redirect: false });
    if (res?.error) { setError("Invalid username or password"); setLoading(false); }
    else router.push("/");
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float inline-block">🏢</div>
          <h1 className="text-white font-bold text-2xl font-display">Admin Login</h1>
          <p className="text-purple-200 text-sm mt-1">BDA Netravathi Apartment</p>
        </div>
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-purple-100 text-sm font-medium block mb-2">Username</label>
              <input type="text" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
                placeholder="admin"/>
            </div>
            <div>
              <label className="text-purple-100 text-sm font-medium block mb-2">Password</label>
              <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
                placeholder="••••••••"/>
            </div>
            {error && <p className="text-rose-300 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-white font-bold text-base hover:from-gold-500 hover:to-amber-600 transition disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in as Admin"}
            </button>
          </form>
          <button onClick={() => router.push("/")} className="w-full mt-3 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm hover:text-white hover:border-white/40 transition">
            Continue as Viewer →
          </button>
        </div>
      </div>
    </div>
  );
}
