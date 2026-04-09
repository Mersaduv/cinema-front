import AdminPlaceholderPage from "../../../components/admin/AdminPlaceholderPage";

export default function GenresPage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Genres"
      description="این صفحه پایه‌ی مدیریت ژانرها را فراهم می‌کند تا فیلم و سریال از همان ابتدا با دسته‌بندی درست ثبت شوند."
      highlights={[
        "فهرست ژانرها با آمادگی برای فرم افزودن و ویرایش",
        "استفاده مستقیم در فرم فیلم و سریال برای دسته‌بندی استاندارد",
        "پایه‌ی لازم برای browse و فیلتر در سایت کاربری",
      ]}
      nextStep="بعد از تثبیت UI، مدیریت واقعی ژانرها و اتصال آن‌ها به محتوا پیاده می‌شود."
    />
  );
}
