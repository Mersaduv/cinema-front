export function mapAuthErrorMessage(
  message?: string,
  fallback = "ورود ناموفق بود. لطفا دوباره تلاش کنید.",
): string {
  if (!message) {
    return fallback;
  }

  if (message === "Invalid credentials") {
    return "ایمیل یا رمز عبور اشتباه است.";
  }

  if (message === "CAPTCHA validation failed.") {
    return "تأیید کپچا ناموفق بود. لطفا دوباره تلاش کنید.";
  }

  if (message.startsWith("Too many login attempts")) {
    return "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفا کمی بعد دوباره تلاش کنید.";
  }

  return message;
}
