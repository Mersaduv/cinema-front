import AdminTaxonomyManagerPage from "../../../components/admin/AdminTaxonomyManagerPage";

export default function CountriesPage() {
  return (
    <AdminTaxonomyManagerPage
      taxonomyType="countries"
      badge="طبقه بندی محتوا"
      title="کشورها"
      singularLabel="کشور"
      description="کشورها برای ثبت مبدأ یا محدوده تولید محتوا نگه‌داری می‌شوند و در فرم فیلم به‌صورت چندانتخابی قابل استفاده هستند."
    />
  );
}
