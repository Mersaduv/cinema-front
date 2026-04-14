import AdminTaxonomyManagerPage from "../../../components/admin/AdminTaxonomyManagerPage";

export default function GenresPage() {
  return (
    <AdminTaxonomyManagerPage
      taxonomyType="genres"
      badge="طبقه بندی محتوا"
      title="ژانرها"
      singularLabel="ژانر"
      description="ژانرها ساختار اصلی دسته‌بندی فیلم‌ها هستند و مستقیماً در فرم ثبت و انتشار محتوا استفاده می‌شوند."
    />
  );
}
