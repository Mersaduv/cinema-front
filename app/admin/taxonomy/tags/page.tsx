import AdminTaxonomyManagerPage from "../../../components/admin/AdminTaxonomyManagerPage";

export default function TagsPage() {
  return (
    <AdminTaxonomyManagerPage
      taxonomyType="tags"
      badge="طبقه بندی محتوا"
      title="تگ‌ها"
      singularLabel="تگ"
      description="تگ‌ها برچسب‌های آزادتر برای جست‌وجو، کشف محتوا و غنی‌تر شدن metadata فیلم‌ها هستند."
    />
  );
}
