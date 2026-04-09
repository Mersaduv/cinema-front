import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function CountriesPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Countries"
      description="این بخش برای نگهداری کشورها و ارتباط آن‌ها با metadata محتوای سینما استفاده خواهد شد."
      highlights={[
        "فهرست کشورهای تولید یا انتشار محتوا",
        "آمادگی برای اتصال به فرم فیلم، سریال و فیلترهای سایت",
        "پایه‌ی لازم برای یکدستی داده‌های مرجع در سراسر پروژه",
      ]}
      nextStep="در مرحله بعد فرم‌ها و لیست واقعی کشورها به دیتابیس و فرم‌های محتوا متصل می‌شوند."
    />
  );
}
