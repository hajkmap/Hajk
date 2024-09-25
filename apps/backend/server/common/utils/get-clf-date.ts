// Generates CLF date on the format: [10/Sep/2024:12:34:56 +0200]
export function getCLFDate(): string {
  const now = new Date();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absOffset = Math.abs(offset);
  const hoursOffset = String(Math.floor(absOffset / 60)).padStart(2, "0");
  const minutesOffset = String(absOffset % 60).padStart(2, "0");

  // Format date parts
  const day = String(now.getDate()).padStart(2, "0");
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Construct CLF timestamp
  return `[${day}/${month}/${year}:${hours}:${minutes}:${seconds} ${sign}${hoursOffset}${minutesOffset}]`;
}
