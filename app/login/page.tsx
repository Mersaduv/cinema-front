"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { FaGoogle } from "react-icons/fa6";
import {
  MdMovie,
  MdFavorite,
  MdRateReview,
  MdHistory,
  MdNotifications
} from "react-icons/md";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import TvLoginPanel from "../components/tv/TvLoginPanel";
import { useIsTv } from "../hooks/useTvCapabilities";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const isTv = useIsTv();

  const resolveRedirect = () => {
    if (typeof window === "undefined") {
      return "/";
    }

    const next = new URLSearchParams(window.location.search).get("redirect") || "/";

    return next.startsWith("/") ? next : "/";
  };

  // Redirect if already authenticated (using useEffect to avoid render error)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(resolveRedirect());
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("لطفا تمام فیلدها را پر کنید");
      setLoading(false);
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      router.replace(resolveRedirect());
    } else {
      setError(result.message || "ورود ناموفق بود. لطفا دوباره تلاش کنید.");
    }

    setLoading(false);
  };

  const features = [
    {
      icon: MdMovie,
      title: "درخواست ها",
      description: "دسترسی به هزاران فیلم و سریال با کیفیت بالا"
    },
    {
      icon: MdFavorite,
      title: "لیست علاقه‌مندی‌ها",
      description: "فیلم‌ها و سریال‌های مورد علاقه خود را ذخیره کنید"
    },
    {
      icon: MdRateReview,
      title: "نظردهی و امتیاز",
      description: "به فیلم‌ها و سریال‌ها امتیاز دهید و نظر خود را ثبت کنید"
    },
    {
      icon: MdHistory,
      title: "تاریخچه تماشا",
      description: "تاریخچه کامل فیلم‌ها و سریال‌های تماشا شده"
    },
    {
      icon: MdNotifications,
      title: "اطلاع‌رسانی",
      description: "اطلاع از اکران فیلم‌ها و سریال‌های جدید"
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Sign In Form (Dark Background) */}
      <div className="flex-1 flex flex-col bg-[#121212]">
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full max-w-md mx-auto">

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                ورود به حساب کاربری
              </h1>
              <p className="text-sm text-gray-400">
                ایمیل و رمز عبور خود را وارد کنید
              </p>
            </div>

            {/* Social Login Buttons */}
            {isTv ? (
              <div className="mb-6">
                <TvLoginPanel />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 mb-6">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8005'}/auth/google`}
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-normal text-gray-300 bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg hover:bg-[#2a2a2a] hover:border-[#3f3f3f] hover:text-white transition-all duration-200"
                >
                  <FaGoogle className="w-5 h-5" />
                  <span>ورود با گوگل</span>
                </a>
              </div>
            )}

            {/* Divider */}
            {!isTv ? (
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2f2f2f]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 py-1 text-gray-500 bg-[#121212]">
                  یا
                </span>
              </div>
            </div>
            ) : null}

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  ایمیل <span className="text-[#f5c518]">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@gmail.com"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#2f2f2f] bg-[#1f1f1f] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  رمز عبور <span className="text-[#f5c518]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور خود را وارد کنید"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-[#2f2f2f] bg-[#1f1f1f] px-4 py-2.5 pr-12 text-sm text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showPassword ? (
                      <HiEyeOff className="w-5 h-5" />
                    ) : (
                      <HiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#2f2f2f] bg-[#1f1f1f] text-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/20 cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-normal text-gray-400 cursor-pointer select-none"
                  >
                    مرا به خاطر بسپار
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#f5c518] hover:text-[#e0b615] transition-colors duration-200"
                >
                  فراموشی رمز عبور؟
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#e0b615] focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#121212] transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#f5c518]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "در حال ورود..." : "ورود"}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-400 sm:text-start">
                حساب کاربری ندارید؟{" "}
                <Link
                  href="/signup"
                  className="text-[#f5c518] hover:text-[#e0b615] font-medium transition-colors duration-200"
                >
                  ثبت نام کنید
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Features Info (Dark Background) */}
      <div className="hidden lg:flex justify-center items-center lg:w-1/2 bg-gradient-to-br from-[#121212] via-[#fcd60031] to-[#0f0f0f] relative overflow-hidden">
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(245, 197, 24, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(245, 197, 24, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center px-12 py-16 text-white">
          {/* Logo/Brand */}
          <div className="mb-12 text-center">
            <Image
              src="/images/cinema_logo.png"
              alt="logo"
              width={150}
              height={150}
              className="h-20 w-auto"
              loading="eager"
            />
          </div>

          {/* Features List */}
          <div className="w-full max-w-md space-y-6">
            <h3 className="text-xl font-semibold mb-6 text-center">
              بعد از ثبت‌نام می‌توانید:
            </h3>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10"
                >
                  <div className="shrink-0 mt-1">
                    <Icon className="w-6 h-6 text-[#f5c518]" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
