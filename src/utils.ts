export function safeJSONParse(str: string, defaultValue = {}) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
}

export function getDateTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}-${month}-${day}`;
}
