import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function EpisodesPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Episodes"
      description="این بخش برای اپیزودهاست و بعداً نقطه‌ی اصلی اتصال اپیزود به فایل مدیا، HLS و وضعیت پردازش خواهد بود."
      highlights={[
        "طراحی اولیه برای فهرست و ثبت اپیزودهای هر فصل",
        "آمادگی برای اتصال به source path و master.m3u8 در مراحل بعدی",
        "هماهنگی با ساختار media flow بدون تکرار فایل‌ها",
      ]}
      nextStep="در بخش media flow همین صفحه به منطق ثبت منبع مدیا و خروجی HLS متصل خواهد شد."
    />
  );
}
