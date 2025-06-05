const formatRupiah = (value) => {
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getDurationInHours = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

module.exports = {
  formatRupiah,
  formatDate,
  getDurationInHours,
};
