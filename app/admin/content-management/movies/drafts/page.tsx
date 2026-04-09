import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function MovieDraftsPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Drafts"
      description="این صفحه برای فیلم‌هایی است که هنوز کامل نشده‌اند یا در وضعیت پیش‌نویس نگه داشته می‌شوند."
      highlights={[
        "نمایش فیلم‌هایی که metadata یا مدیای آن‌ها هنوز نهایی نشده است",
        "جدا بودن draftها از محتوای آماده انتشار برای کنترل بهتر پنل",
        "آمادگی برای اتصال به فرم Add Movie و تکمیل مرحله‌ای اطلاعات",
      ]}
      nextStep="در مرحله بعد وضعیت draft از دیتابیس خوانده می‌شود و اکشن تکمیل یا انتشار به آن افزوده خواهد شد."
    />
  );
}
