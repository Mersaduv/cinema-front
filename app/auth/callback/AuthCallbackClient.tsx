"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { tokenStorage, type User } from "../../lib/auth";
import { primeSessionUser } from "../../lib/session-service";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const token = searchParams.get("token");
  const userParam = searchParams.get("user");
  const errorParam = searchParams.get("error");

  const errorMessage = useMemo(() => {
    if (errorParam) {
      return decodeURIComponent(errorParam);
    }

    if (!token) {
      return "Token not found";
    }

    return "";
  }, [errorParam, token]);

  useEffect(() => {
    if (errorMessage) {
      const redirectTimer = window.setTimeout(() => {
        router.push("/login");
      }, 3000);

      return () => window.clearTimeout(redirectTimer);
    }

    if (!token) {
      return;
    }

    tokenStorage.setToken(token);

    if (userParam) {
      try {
        const parsedUser = JSON.parse(atob(userParam)) as User;
        if (parsedUser?.id) {
          primeSessionUser(parsedUser);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    let isCancelled = false;

    void refreshUser().then(() => {
      if (isCancelled) {
        return;
      }

      if (userParam) {
        try {
          const user = JSON.parse(atob(userParam));
          if (!user.name || user.name.trim() === "") {
            router.push("/auth/complete-profile");
            return;
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      router.push("/");
    });

    return () => {
      isCancelled = true;
    };
  }, [errorMessage, refreshUser, router, token, userParam]);

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4 text-red-400 text-lg">{errorMessage}</div>
          <p className="text-gray-400">در حال انتقال به صفحه ورود...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-[#f5c518]"></div>
        <p className="mt-4 text-gray-400">در حال ورود...</p>
      </div>
    </div>
  );
}
