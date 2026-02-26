export function initialsFromName(fullName) {
  const clean = (fullName ?? "").trim();
  if (!clean) return "QR";

  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}
