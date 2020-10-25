export function getHourOffset (hrs, fromTime) {
  const now = new Date()
  const hrsInt = JSON.parse(hrs)
  const dt = new Date(fromTime)
  dt.setHours(dt.getHours() + hrsInt)
  if (dt > now) {
    return dt
  } else {
    // ensure we are at least moving forward in time to avoid a loop
    now.setHours(dt.getHours() + hrsInt)
  }
}
