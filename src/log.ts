import { configure, getLogger } from "log4js";

export function initLogger(log = "log") {
  configure({
    appenders: {
      [log]: { type: "file", filename: "logs/log.log" },
    },
    categories: {
      default: { appenders: [log], level: "info" },
    },
  });

  const logger = getLogger(log);
  return logger;
}
