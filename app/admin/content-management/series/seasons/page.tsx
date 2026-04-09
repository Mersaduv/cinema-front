import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function SeasonsPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Seasons"
      description="در این صفحه ساختار اولیه فصل‌های هر سریال شکل می‌گیرد تا بعداً به اپیزودها و مدیا متصل شود."
      highlights={[
        "ثبت و مشاهده فصل‌ها به‌صورت مستقل اما وابسته به سریال",
        "آمادگی برای ترتیب، شماره فصل و وضعیت انتشار",
        "پایه‌ی لازم برای اتصال اپیزودها و media source در مرحله بعد",
      ]}
      nextStep="بعد از تکمیل ساختار سریال‌ها، فرم و لیست واقعی فصل‌ها در همین بخش پیاده می‌شود."
    />
  );
}
