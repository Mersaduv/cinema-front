import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function AllSeriesPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="All Series"
      description="این صفحه نمای پایه‌ی تمام سریال‌ها را ارائه می‌دهد و بعداً به فصل‌ها، اپیزودها و metadata متصل می‌شود."
      highlights={[
        "فهرست کلی مجموعه‌ها با وضعیت انتشار و وضعیت تکمیل ساختار",
        "آمادگی برای ورود سریع به مدیریت فصل و اپیزود هر سریال",
        "ساختار هماهنگ با بخش فیلم‌ها برای حفظ یک‌دستی پنل",
      ]}
      nextStep="در ادامه کارت‌ها و لیست‌های سریال به داده‌های واقعی و روابط فصل و اپیزود متصل می‌شوند."
    />
  );
}
