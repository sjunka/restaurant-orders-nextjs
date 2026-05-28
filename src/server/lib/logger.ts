type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, data: Record<string, unknown>, msg: string) {
  const entry = { level, msg, ...data, ts: new Date().toISOString() };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (data: Record<string, unknown>, msg: string) => log("info", data, msg),
  warn: (data: Record<string, unknown>, msg: string) => log("warn", data, msg),
  error: (data: Record<string, unknown>, msg: string) => log("error", data, msg),
};
