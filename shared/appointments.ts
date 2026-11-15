const zone = "Asia/Beirut";
export function salonDateOptions(now = new Date(), locale = "ar-LB") {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const anchor = Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")), 12);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor + (index + 1) * 86400000);
    return { id: date.toISOString().slice(0, 10), label: date.toLocaleDateString(locale, { timeZone: zone, weekday: "short", month: "short", day: "numeric" }) };
  });
}
/** Convert a Beirut wall-clock appointment to UTC, including winter/summer offsets. */
export function salonAppointmentISO(day: string, time: string) {
  const target = Date.parse(`${day}T${time}:00Z`);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
    const part = (name: string) => parts.find(p => p.type === name)!.value;
    const wallClock = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`);
    instant += target - wallClock;
  }
  return new Date(instant).toISOString();
}
