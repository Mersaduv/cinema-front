import AdminTaxonomyManagerPage from "../../../components/admin/AdminTaxonomyManagerPage";

export default function ActorsPage() {
  return (
    <AdminTaxonomyManagerPage
      taxonomyType="actors"
      badge="طبقه بندی محتوا"
      title="بازیگران"
      singularLabel="بازیگر"
      description="فهرست بازیگران از این بخش مدیریت می‌شود و بعد در فرم‌های فیلم برای انتخاب سریع و یک‌دست استفاده خواهد شد."
    />
  );
}
