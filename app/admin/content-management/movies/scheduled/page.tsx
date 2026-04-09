import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function ScheduledMoviesPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Scheduled"
      description="این بخش محل نمایش فیلم‌هایی خواهد بود که برای انتشار در زمان مشخص برنامه‌ریزی شده‌اند."
      highlights={[
        "مشاهده‌ی محتوای زمان‌بندی‌شده به‌صورت جدا از draft و published",
        "آمادگی برای ثبت تاریخ و ساعت انتشار از فرم‌های مدیریت محتوا",
        "پایه‌ی لازم برای کنترل بهتر صف انتشار در پنل مدیریت",
      ]}
      nextStep="بعد از ساخت فیلدهای انتشار، زمان‌بندی واقعی و هشدارهای مدیریتی به این صفحه افزوده می‌شود."
    />
  );
}
