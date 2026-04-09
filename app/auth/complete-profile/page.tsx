"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../lib/api";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, refreshUser, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.name && user.name.trim() !== "") {
      router.push("/");
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || name.trim() === "") {
      setError("لطفا نام خود را وارد کنید");
      return;
    }

    if (name.length < 2) {
      setError("نام باید حداقل 2 کاراکتر باشد");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/complete-profile", { name });
      
      if (response.success) {
        await refreshUser();
        router.push("/");
      } else {
        setError(response.message || "خطا در تکمیل پروفایل");
      }
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || (user?.name && user.name.trim() !== "")) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1f1f1f] rounded-lg border border-[#2f2f2f] p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              تکمیل پروفایل
            </h1>
            <p className="text-sm text-gray-400">
              لطفا نام کامل خود را وارد کنید
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                نام کامل <span className="text-[#f5c518]">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                required
                disabled={loading}
                className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#f5c518] focus:outline-none focus:ring-2 focus:ring-[#f5c518]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#e0b615] focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:ring-offset-2 focus:ring-offset-[#121212] transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#f5c518]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "در حال ذخیره..." : "تکمیل پروفایل"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
