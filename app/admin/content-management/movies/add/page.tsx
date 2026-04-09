import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function AddMoviePage() {
  return (
    <AdminPlaceholderPage
      badge="نمای اولیه"
      title="Add Movie"
      description="فرم پایه‌ی ثبت فیلم از اینجا شروع می‌شود و بعداً به metadata، طبقه بندی ها و media source متصل خواهد شد."
      highlights={[
        "طراحی اولیه فرم ثبت عنوان، slug، پوستر و وضعیت انتشار",
        "آمادگی برای اتصال به genres، countries، languages و tags",
        "در ادامه اتصال مستقیم به source path و media flow انجام می‌شود",
      ]}
      nextStep="در بخش بعدی همین صفحه به فرم واقعی ثبت فیلم و انتخاب طبقه بندی ها وصل خواهد شد."
    />
  );
}
