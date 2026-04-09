import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function TagsPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Tags"
      description="این بخش برای برچسب‌های منعطف است تا جست‌وجو، ارتباطات معنایی و کشف محتوا در آینده دقیق‌تر انجام شود."
      highlights={[
        "طراحی اولیه برای لیست و افزودن tagها",
        "امکان استفاده در فیلم، سریال و حتی استریم‌های زنده",
        "پایه‌ی مناسب برای search و recommendation در مراحل بعدی",
      ]}
      nextStep="بعد از نهایی شدن طبقه بندی ها، فرم‌های واقعی مدیریت tags و ارتباط آن‌ها با محتوا پیاده می‌شود."
    />
  );
}
