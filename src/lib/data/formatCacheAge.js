export default function formatCacheAge(timestamp) {
  if (!timestamp) return null;
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 min ago";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "Updated 1 hr ago" : `Updated ${hours} hr ago`;
}
