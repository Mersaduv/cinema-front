import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function LanguagesPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Languages"
      description="این صفحه برای مدیریت زبان‌های اصلی، دوبله و زیرنویس طراحی شده و بعداً در metadata و player استفاده می‌شود."
      highlights={[
        "فهرست زبان‌های قابل استفاده در محتوا",
        "آمادگی برای اتصال به صوت، دوبله و زیرنویس",
        "پایه‌ی لازم برای فیلتر و نمایش بهتر در سایت کاربری",
      ]}
      nextStep="در گام بعد، زبان‌ها به فرم‌های ثبت فیلم و سریال و metadata مدیا متصل خواهند شد."
    />
  );
}
