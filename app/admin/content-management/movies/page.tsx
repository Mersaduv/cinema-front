import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function AllMoviesPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="All Movies"
      description="این صفحه محل فهرست کامل فیلم‌ها خواهد بود؛ از پیش‌نمایش وضعیت انتشار تا اتصال بعدی به منبع مدیا و HLS."
      highlights={[
        "جدول یا کارت‌های فیلم با وضعیت انتشار، وضعیت مدیا و زمان آخرین بروزرسانی",
        "فیلتر بر اساس draft، scheduled و published در ساختار یکپارچه",
        "آمادگی برای اکشن‌های بعدی مثل ویرایش، زمان‌بندی و ورود به media flow",
      ]}
      nextStep="بعد از تثبیت ساختار، داده‌های واقعی فیلم‌ها و اکشن‌های مدیریت محتوا به این صفحه متصل می‌شوند."
    />
  );
}
