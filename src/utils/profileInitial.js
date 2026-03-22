/** Erster Buchstabe für Profil-Avatar. */
export function profileInitial(name, email) {
  const s = String(name || "").trim();
  if (s) {
    return s.charAt(0).toUpperCase();
  }
  const e = String(email || "").trim();
  if (e) {
    return e.charAt(0).toUpperCase();
  }
  return "?";
}
