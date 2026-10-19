const TIME_ZONE = "Africa/Lagos";

export function formatPrice(price) {
  return price === 0 ? "Free" : "₦" + Number(price).toLocaleString("en-NG");
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatTime(iso) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

// Pieces for the big date block on cards: { day: "14", month: "NOV" }
export function dateParts(iso) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-NG", { day: "numeric", timeZone: TIME_ZONE }).format(date);
  const month = new Intl.DateTimeFormat("en-NG", { month: "short", timeZone: TIME_ZONE })
    .format(date)
    .toUpperCase();
  return { day, month };
}
