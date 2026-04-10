const BAGHDAD_TIME_ZONE = 'Asia/Baghdad';

const BAGHDAD_DATE_FORMATTER = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  numberingSystem: 'latn',
  timeZone: BAGHDAD_TIME_ZONE,
});

const BAGHDAD_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  numberingSystem: 'latn',
  timeZone: BAGHDAD_TIME_ZONE,
});

export function formatBaghdadDate(date) {
  return BAGHDAD_DATE_FORMATTER.format(date);
}

export function formatBaghdadTime(date) {
  return BAGHDAD_TIME_FORMATTER.format(date);
}
