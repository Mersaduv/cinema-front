import AdminModuleIndexPage from "../../components/admin/AdminModuleIndexPage";

export default function TaxonomyPage() {
  return (
    <AdminModuleIndexPage
      badge="زیرمجموعه مدیریت مدیا"
      title="طبقه بندی ها"
      description="این بخش داده‌های مرجع و طبقه‌بندی محتوا را نگه می‌دارد تا در فرم‌های فیلم و سریال بتوانیم از ساختار تمیز، قابل فیلتر و قابل توسعه استفاده کنیم."
      groups={[
        {
          title: "Classification",
          description:
            "ساختارهای دسته‌بندی اصلی که مستقیماً روی فیلم‌ها و سریال‌ها اثر دارند.",
          links: [
            {
              label: "Genres",
              href: "/admin/taxonomy/genres",
              description: "ژانرهای محتوایی برای browse و filtering",
            },
            {
              label: "Tags",
              href: "/admin/taxonomy/tags",
              description: "برچسب‌های آزاد برای جست‌وجو و کشف محتوا",
            },
          ],
        },
        {
          title: "Localization",
          description:
            "داده‌های مرجع مربوط به کشور و زبان که در metadata و ارائه محتوا استفاده می‌شوند.",
          links: [
            {
              label: "Countries",
              href: "/admin/taxonomy/countries",
              description: "کشورهای تولید یا انتشار محتوا",
            },
            {
              label: "Languages",
              href: "/admin/taxonomy/languages",
              description: "زبان‌های صوت، دوبله و زیرنویس",
            },
          ],
        },
      ]}
      nextStep="در گام بعدی، لیست‌ها و فرم‌های واقعی طبقه بندی ها را می‌سازیم تا فیلم و سریال از همان ابتدا به داده‌های مرجع درست متصل شوند."
    />
  );
}
