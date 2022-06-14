module.exports = () => {
  const date = new Date();
  const day = date.getDay();
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ][date.getMonth()];
  const hours = date.getHours() % 12 ? date.getHours() % 12 : 12;
  let minutes = date.getMinutes();
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const dateInfo =
    hours +
    ":" +
    minutes +
    " " +
    ampm +
    " " +
    weekday +
    ", " +
    month +
    " " +
    day;
  return dateInfo;
};
