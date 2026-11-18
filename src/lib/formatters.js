export function formatDate(value, language = "az") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function relativeDays(value, language = "az") {
  if (!value) return "";
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return language === "az" ? "Bu gün bitir" : "Ends today";
  if (diff > 0) {
    return language === "az"
      ? `${diff} gün qalıb`
      : `${diff} days left`;
  }
  const elapsed = Math.abs(diff);
  return language === "az"
    ? `${elapsed} gün əvvəl bitib`
    : `Expired ${elapsed} days ago`;
}
