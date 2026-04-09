import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function LiveStreamsPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Live TV / Streams"
      description="این بخش برای کانال‌های زنده و استریم‌ها در نظر گرفته شده تا بعداً به منابع پخش زنده و تنظیمات اختصاصی آن‌ها متصل شود."
      highlights={[
        "طراحی اولیه برای فهرست کانال‌ها و منابع استریم زنده",
        "پایه‌ی لازم برای ثبت URL، وضعیت اتصال و metadata استریم",
        "امکان توسعه در آینده بدون تداخل با ساختار فیلم و سریال",
      ]}
      nextStep="بعد از تکمیل بخش‌های اصلی محتوا، ساختار فرم و مانیتورینگ استریم زنده روی همین صفحه افزوده می‌شود."
    />
  );
}
