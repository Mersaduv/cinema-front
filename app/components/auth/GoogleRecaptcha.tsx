"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        params: Record<string, unknown>,
      ) => number;
      reset?: (widgetId?: number) => void;
    };
  }
}

type GoogleRecaptchaProps = {
  siteKey?: string | null;
  onToken: (token: string) => void;
  onExpired?: () => void;
  /** Increment to force a fresh widget after failed submissions. */
  resetKey?: number;
};

export default function GoogleRecaptcha({
  siteKey,
  onToken,
  onExpired,
  resetKey = 0,
}: GoogleRecaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    if (!siteKey) return;
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;

    const ensureScript = (): Promise<void> => {
      const existing = document.getElementById("google-recaptcha-script");
      if (existing) {
        return waitForGrecaptcha();
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = "google-recaptcha-script";
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.onload = () => {
          void waitForGrecaptcha().then(resolve).catch(reject);
        };
        script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
        document.head.appendChild(script);
      });
    };

    const waitForGrecaptcha = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (window.grecaptcha?.render) {
          resolve();
          return;
        }

        let attempts = 0;
        const interval = window.setInterval(() => {
          attempts += 1;
          if (window.grecaptcha?.render) {
            window.clearInterval(interval);
            resolve();
            return;
          }

          if (attempts >= 50) {
            window.clearInterval(interval);
            reject(new Error("reCAPTCHA unavailable"));
          }
        }, 100);
      });

    const renderWidget = () => {
      if (!window.grecaptcha?.render) return;
      if (!containerRef.current) return;

      if (widgetIdRef.current !== null && window.grecaptcha.reset) {
        window.grecaptcha.reset(widgetIdRef.current);
        onTokenRef.current("");
        return;
      }

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onTokenRef.current(token),
        "expired-callback": () => {
          onExpiredRef.current?.();
          onTokenRef.current("");
        },
      });
    };

    void ensureScript()
      .then(() => renderWidget())
      .catch(() => {
        onTokenRef.current("");
      });

    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      onTokenRef.current("");
    };
  }, [siteKey, resetKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} />;
}

