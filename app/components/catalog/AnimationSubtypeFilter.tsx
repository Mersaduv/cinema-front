"use client";

import FilterCheckbox from "../ui/FilterCheckbox";
import FilterDropdown from "./FilterDropdown";
import {
  ANIMATION_SUBTYPE_OPTIONS,
  DEFAULT_ANIMATION_SUBTYPES,
  formatAnimationSubtypesLabel,
  type SelectableAnimationSubtype,
} from "../../lib/catalog/animation";

export default function AnimationSubtypeFilter({
  value,
  onChange,
}: {
  value: SelectableAnimationSubtype[];
  onChange: (subtypes: SelectableAnimationSubtype[]) => void;
}) {
  const valueLabel = formatAnimationSubtypesLabel(value);

  const toggleSubtype = (subtype: SelectableAnimationSubtype) => {
    if (value.includes(subtype)) {
      if (value.length <= 1) {
        return;
      }
      onChange(value.filter((item) => item !== subtype));
      return;
    }

    onChange([...value, subtype]);
  };

  return (
    <FilterDropdown label="دسته‌بندی" valueLabel={valueLabel} minWidth="240px">
      <div className="p-2">
        {ANIMATION_SUBTYPE_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            checked={value.includes(option.value)}
            onChange={() => toggleSubtype(option.value)}
            label={option.label}
            nowrap
            layout="aligned"
          />
        ))}
        {value.length < DEFAULT_ANIMATION_SUBTYPES.length ? (
          <button
            type="button"
            onClick={() => onChange([...DEFAULT_ANIMATION_SUBTYPES])}
            className="mt-1 w-full px-3 py-2 text-right text-xs text-[#3b82f6] hover:underline"
          >
            انتخاب همه
          </button>
        ) : null}
      </div>
    </FilterDropdown>
  );
}
