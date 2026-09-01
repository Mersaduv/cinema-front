"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { confirmTvActivation } from "../lib/tv-activation";
import { tokenStorage } from "../lib/token-storage";
import { TV_FOCUS_RING_CLASS } from "../lib/tv/focus";

export default function TvLoginPage() {
  return (
    <ProtectedRoute requireViewer>
      <TvLoginConfirmForm />
    </ProtectedRoute>
  );
}

function TvLoginConfirmForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const token = tokenStorage.getToken();

      if (!token) {
        setError("ابتدا وارد حساب کاربری خود شوید.");
        setLoading(false);
        return;
      }

      await confirmTvActivation(code.trim(), token);
      setMessage("تلویزیون متصل شد. می‌توانید به تماشا برگردید.");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تأیید کد ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-12" dir="rtl">
      <h1 className="text-2xl font-black text-white">اتصال تلویزیون</h1>
      <p className="mt-2 text-sm leading-7 text-white/60">
        کد نمایش‌داده‌شده روی تلویزیون را وارد کنید تا دستگاه به حساب شما متصل شود.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="مثال: ABCD-1234"
          className={`w-full rounded-2xl border border-white/12 bg-[#0d1118] px-4 py-3.5 text-center font-mono text-lg tracking-widest text-white outline-none ${TV_FOCUS_RING_CLASS}`}
          maxLength={9}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || code.trim().length < 4}
          className={`w-full rounded-2xl bg-[#f5c518] py-3.5 text-sm font-bold text-[#12100a] disabled:opacity-50 ${TV_FOCUS_RING_CLASS}`}
        >
          {loading ? "در حال تأیید…" : "اتصال تلویزیون"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-[#86efac]">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-[#fda4af]">{error}</p> : null}

      <button
        type="button"
        onClick={() => router.push("/")}
        className={`mt-6 text-sm text-white/50 hover:text-white ${TV_FOCUS_RING_CLASS}`}
      >
        بازگشت به خانه
      </button>
    </div>
  );
}
