/**
 * @param {import("i18next").TFunction} t
 * @param {string | null | undefined} lastSeenIso
 * @param {boolean} isOnline
 * @param {string} language
 */
export function formatProfilePresence(t, lastSeenIso, isOnline, language) {
  if (isOnline) {
    return t("profile.presenceOnline");
  }
  if (!lastSeenIso) {
    return t("profile.presenceUnknown");
  }
  const d = new Date(lastSeenIso);
  if (Number.isNaN(d.getTime())) {
    return t("profile.presenceUnknown");
  }
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) {
    return t("profile.presenceJustNow");
  }
  if (mins < 60) {
    return t("profile.presenceMinutesAgo", { count: mins });
  }
  if (hrs < 24) {
    return t("profile.presenceHoursAgo", { count: hrs });
  }
  if (days < 7) {
    return t("profile.presenceDaysAgo", { count: days });
  }
  return d.toLocaleString(language === "de" ? "de-DE" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
