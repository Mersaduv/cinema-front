"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

export default function AdminBodLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const {
    staffLogin,
    isAuthenticated,
    isStaff,
    hasRole,
    authReady,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady || authLoading) {
      return;
    }

    if (isAuthenticated && isStaff && hasRole("admin")) {
      router.replace("/admin");
    }
  }, [authReady, authLoading, isAuthenticated, isStaff, hasRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("لطفا تمام فیلدها را پر کنید");
      setLoading(false);
      return;
    }

    const result = await staffLogin(email, password);

    if (result.success) {
      router.replace("/admin");
    } else {
      setError(result.message || "ورود ناموفق بود. لطفا دوباره تلاش کنید.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f14]">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,197,24,0.18),transparent_55%),linear-gradient(160deg,#101820_0%,#0b0f14_55%,#151a22_100%)]" />
        <div className="relative z-10 max-w-md px-10 text-center text-white">
          <Image
            src="/images/cinema_logo.png"
            alt="logo"
            width={140}
            height={140}
            className="mx-auto h-16 w-auto"
            loading="eager"
          />
          <h2 className="mt-8 text-3xl font-bold tracking-tight">ورود پنل مدیریت</h2>

        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f5c518]/80">
              Admin Access
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white">ورود کاربران پنل</h1>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="staff-email" className="mb-2 block text-sm text-white/70">
                ایمیل
              </label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/50"
              />
            </div>

            <div>
              <label htmlFor="staff-password" className="mb-2 block text-sm text-white/70">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pl-12 text-sm text-white outline-none transition focus:border-[#f5c518]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                >
                  {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#f5c518] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#e0b615] disabled:opacity-50"
            >
              {loading ? "در حال ورود..." : "ورود به پنل"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            بیننده هستید؟{" "}
            <Link href="/login" className="text-[#f5c518] hover:text-[#e0b615]">
              ورود بینندگان
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
