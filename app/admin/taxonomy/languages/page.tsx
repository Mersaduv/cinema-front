import AdminTaxonomyManagerPage from "../../../components/admin/AdminTaxonomyManagerPage";

export default function LanguagesPage() {
  return (
    <AdminTaxonomyManagerPage
      taxonomyType="languages"
      badge="طبقه بندی محتوا"
      title="زبان‌ها"
      singularLabel="زبان"
      description="زبان‌ها برای صوت، دوبله یا زبان اصلی محتوا نگه‌داری می‌شوند تا در فرم فیلم و مرور محتوا انتخاب شوند."
    />
  );
}
