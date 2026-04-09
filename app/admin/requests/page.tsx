import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

export default function AdminRequestsPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="درخواست ها"
      description="این بخش برای مدیریت درخواست‌های کاربران مثل درخواست فیلم، سریال یا پیگیری‌های پشتیبانی آماده شده تا بعداً به جریان بررسی و پاسخ متصل شود."
      highlights={[
        "ثبت و نمایش درخواست‌های محتوایی یا پشتیبانی",
        "آمادگی برای دسته‌بندی درخواست‌ها بر اساس نوع و اولویت",
        "پایه‌ی اتصال به وضعیت رسیدگی و پاسخ‌گویی تیم",
      ]}
      nextStep="در ادامه، لیست واقعی درخواست‌ها، فیلترها و وضعیت‌های رسیدگی روی همین صفحه پیاده می‌شود."
    />
  );
}
