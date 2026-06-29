import { contentWarningLabel } from "../../lib/content-metadata-options";

type ContentMetadataPillsProps = {
  contentWarnings?: string[] | null;
};

export default function ContentMetadataPills({
  contentWarnings,
}: ContentMetadataPillsProps) {
  const warnings = (contentWarnings ?? []).filter(Boolean);

  if (!warnings.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {warnings.map((warning) => (
        <span
          key={`warning-${warning}`}
          className="rounded-full border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1 text-xs font-medium text-[#fdba74]"
        >
          {contentWarningLabel(warning)}
        </span>
      ))}
    </div>
  );
}
