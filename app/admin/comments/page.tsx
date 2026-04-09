import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

export default function AdminCommentsPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="دیدگاه ها"
      description="این بخش برای مرور، دسته‌بندی و مدیریت دیدگاه‌های کاربران در نظر گرفته شده تا بعداً به moderation و ابزارهای پاسخ‌گویی متصل شود."
      highlights={[
        "نمایش دیدگاه‌های ثبت‌شده روی فیلم‌ها و سریال‌ها",
        "آمادگی برای فیلتر بر اساس وضعیت تایید، رد یا بررسی",
        "پایه‌ی اتصال به اکشن‌های مدیریت و پاسخ ادمین",
      ]}
      nextStep="در گام بعدی لیست واقعی دیدگاه‌ها، وضعیت‌های moderation و اکشن‌های مدیریتی به این صفحه متصل می‌شوند."
    />
  );
}
