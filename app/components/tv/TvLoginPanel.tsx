"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { tokenStorage } from "../../lib/token-storage";
import {
  pollTvActivation,
  requestTvActivationCode,
  type TvActivationRequest,
} from "../../lib/tv-activation";
import { TV_FOCUS_RING_CLASS } from "../../lib/tv/focus";

const POLL_MS = 3000;

export default function TvLoginPanel() {
  const { refreshUser } = useAuth();
  const [session, setSession] = useState<TvActivationRequest | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "waiting" | "done">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    setError("");
    setStatus("loading");

    try {
      const data = await requestTvActivationCode();
      setSession(data);
      setStatus("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت کد");
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    void startSession();

    return () => stopPolling();
  }, [startSession, stopPolling]);

  useEffect(() => {
    if (status !== "waiting" || !session?.code) {
      stopPolling();
      return;
    }

    const poll = async () => {
      const result = await pollTvActivation(session.code);

      if (result.status === "activated" && result.token) {
        tokenStorage.setToken(result.token);
        await refreshUser();
        setStatus("done");
        stopPolling();
        return;
      }

      if (result.status === "expired" || result.status === "not_found") {
        setError("کد منقضی شد. کد جدید دریافت کنید.");
        setStatus("idle");
        stopPolling();
      }
    };

    void poll();
    pollRef.current = setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => stopPolling();
  }, [refreshUser, session?.code, status, stopPolling]);

  const pairUrl = session?.pair_url ?? "/tv-login";

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-right" dir="rtl">
      <h3 className="text-lg font-bold text-white">ورود با کد فعال‌سازی</h3>
      <p className="mt-3 text-sm leading-7 text-white/65">
        کد زیر را در موبایل یا کامپیوتر در آدرس{" "}
        <span className="font-mono text-[#f8d977]">{pairUrl}</span> وارد کنید. پس از تأیید،
        تلویزیون به‌صورت خودکار وارد می‌شود.
      </p>

      {status === "done" ? (
        <p className="mt-6 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3 text-sm text-[#86efac]">
          ورود موفق — می‌توانید تماشا را ادامه دهید.
        </p>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-black/30 p-6">
          <p className="text-xs text-white/50">کد فعال‌سازی (۱۰ دقیقه)</p>
          <p className="font-mono text-4xl font-black tracking-[0.2em] text-[#f5c518]">
            {session?.code ?? "····-····"}
          </p>
          {status === "waiting" ? (
            <p className="text-xs text-white/45">در انتظار تأیید از دستگاه همراه…</p>
          ) : null}
          <button
            type="button"
            data-tv-focusable
            onClick={() => void startSession()}
            className={`rounded-2xl border border-white/15 px-5 py-2.5 text-sm text-white/80 ${TV_FOCUS_RING_CLASS}`}
          >
            دریافت کد جدید
          </button>
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-[#fda4af]">{error}</p> : null}

      <p className="mt-4 text-xs text-white/45">
        یا با ایمیل و رمز عبور در همین صفحه وارد شوید.
      </p>
    </div>
  );
}
