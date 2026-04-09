# 📋 ایندکس Frontend (Next.js)

این فایل برای شناسایی سریع ساختار Frontend توسط Agent ها طراحی شده است.

## 🏗️ ساختار Frontend

```
frontend/
├── app/                     # Next.js App Router
│   ├── page.tsx             # صفحه اصلی (Home)
│   ├── layout.tsx            # Layout اصلی
│   ├── globals.css           # استایل‌های全局
│   └── [routes]/            # صفحات دیگر
├── components/              # کامپوننت‌های قابل استفاده مجدد
│   └── (ایجاد خواهد شد)
├── lib/                     # توابع و utilities
│   └── (ایجاد خواهد شد)
├── public/                  # فایل‌های استاتیک
│   └── ...
├── next.config.ts           # تنظیمات Next.js
├── tailwind.config.ts       # تنظیمات TailwindCSS
├── tsconfig.json            # تنظیمات TypeScript
└── package.json             # وابستگی‌ها
```

## 🔑 فایل‌های کلیدی

### صفحات
- `app/page.tsx` - صفحه اصلی (Home) - **آماده است**
- `app/layout.tsx` - Layout اصلی با تنظیمات RTL و فارسی

### تنظیمات
- `next.config.ts` - تنظیمات Next.js
- `tailwind.config.ts` - تنظیمات TailwindCSS
- `tsconfig.json` - تنظیمات TypeScript

### استایل‌ها
- `app/globals.css` - استایل‌های全局 و TailwindCSS

## 🎨 TailwindCSS

پروژه با TailwindCSS استایل‌دهی شده است:
- فایل اصلی: `app/globals.css`
- تنظیمات: `tailwind.config.ts`
- استفاده: کلاس‌های Tailwind در کامپوننت‌ها

## 🌐 RTL و فارسی

- زبان: فارسی (Persian/Farsi)
- جهت: راست به چپ (RTL)
- تنظیمات در `app/layout.tsx`: `<html lang="fa" dir="rtl">`

## 📡 ارتباط با Backend

### API Calls
برای ارتباط با Backend از fetch یا axios استفاده می‌شود:

```typescript
// مثال
const response = await fetch('http://localhost:8000/api/movies');
const data = await response.json();
```

### Environment Variables
می‌توان از `.env.local` برای تنظیمات استفاده کرد:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🚀 دستورات مهم

```bash
# اجرای پروژه در حالت توسعه
npm run dev

# ساخت برای تولید
npm run build

# اجرای نسخه تولید
npm start

# بررسی خطاهای کد
npm run lint
```

## 📦 کامپوننت‌ها

کامپوننت‌های قابل استفاده مجدد در `components/` قرار می‌گیرند:

```
components/
├── ui/              # کامپوننت‌های UI پایه
├── layout/          # کامپوننت‌های Layout
└── features/        # کامپوننت‌های مربوط به ویژگی‌ها
```

## 🔄 Routing

Next.js از App Router استفاده می‌کند:
- `app/page.tsx` → `/`
- `app/about/page.tsx` → `/about`
- `app/movies/page.tsx` → `/movies`
- `app/movies/[id]/page.tsx` → `/movies/:id`

## 📝 نکات مهم

1. تمام صفحات در `app/` قرار دارند
2. کامپوننت‌ها در `components/` قرار می‌گیرند
3. توابع کمکی در `lib/` قرار می‌گیرند
4. فایل‌های استاتیک در `public/` قرار دارند
5. زبان پروژه فارسی است اما نام فایل‌ها و متغیرها انگلیسی است
6. جهت متن RTL است

## 🎯 صفحه اصلی

صفحه اصلی (`app/page.tsx`) آماده است و شامل:
- هدر فارسی
- نمایش تکنولوژی‌های استفاده شده
- طراحی مدرن با TailwindCSS
- پشتیبانی از Dark Mode

## 🔗 لینک‌های مفید

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
