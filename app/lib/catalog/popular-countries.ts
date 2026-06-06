/** Most-used countries first in catalog filters (VOD audience). */
export const POPULAR_COUNTRY_ISOS = [
  "IR",
  "US",
  "GB",
  "FR",
  "DE",
  "TR",
  "IN",
  "JP",
  "KR",
  "CN",
  "CA",
  "AU",
  "IT",
  "ES",
  "RU",
  "AE",
  "SA",
  "EG",
  "BR",
  "MX",
  "NL",
  "SE",
  "CH",
  "AT",
  "PL",
  "GR",
  "PT",
  "AR",
  "ZA",
  "TH",
  "MY",
  "SG",
  "NZ",
  "IE",
  "FI",
  "BE",
  "DK",
  "NO",
  "HK",
  "TW",
  "IL",
  "PK",
  "AF",
  "IQ",
];

export function sortCountriesByPopularity<T extends { iso: string }>(countries: T[]): T[] {
  const rank = new Map(POPULAR_COUNTRY_ISOS.map((iso, index) => [iso, index]));

  return [...countries].sort((first, second) => {
    const a = rank.get(first.iso) ?? 9999;
    const b = rank.get(second.iso) ?? 9999;
    if (a !== b) {
      return a - b;
    }
    return first.iso.localeCompare(second.iso);
  });
}
