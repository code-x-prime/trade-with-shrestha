/**
 * Format date and time for display
 */
export const formatDateTime = (date) => {
  if (!date) return "";

  const d = new Date(date);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // IST
  };

  return d.toLocaleString("en-IN", options);
};
