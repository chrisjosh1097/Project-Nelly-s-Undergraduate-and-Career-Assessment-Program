const JAVA = new Set(["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Banten"]);

export const CAMPUS_PREFERENCE_LABELS: Record<string, string> = {
  "PTN di Jawa": "PTN di Jawa",
  "PTN luar Jawa": "PTN luar Jawa",
  "PTS bagus di kota besar": "Swasta/Lainnya",
};

export function matchesCampusPreferences(
  item: { type: string; province?: string },
  preferences: readonly string[],
): boolean {
  const selected = preferences.filter(p => Object.hasOwn(CAMPUS_PREFERENCE_LABELS, p));
  return !selected.length || selected.some(p => {
    if (p === "PTS bagus di kota besar") return item.type === "Swasta/Lainnya";
    if (item.type !== "Negeri" || !item.province) return false;
    return p === "PTN di Jawa" ? JAVA.has(item.province) : !JAVA.has(item.province);
  });
}
