const winston = require("winston");
const winstonDailyRotateFile = require("winston-daily-rotate-file");
const MESSAGE = Symbol.for("message");
const ERROR_NAME = Symbol.for("name");
const moment = require("moment");

// get the log path
const info_log_path = __dirname + "/../logs/info/";
const error_log_path = __dirname + "/../logs/errors/";

const infoTransport = new winstonDailyRotateFile({
  filename: (process.env.LOG_PATH || info_log_path) + `keystone-ETL-automation-%DATE%.log`,
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  prepend: true,
});

const errorTransport = new winstonDailyRotateFile({
  filename: (process.env.LOG_PATH || error_log_path) + `keystone-ETL-automation-error-%DATE%.log`,
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  prepend: true,
});

const infoJsonFormatter = (logEntry) => {
  const { message, level, ...rest } = logEntry;
  const json = Object.assign(
    { "t": moment().toISOString(), "etl_msg": message.etl_msg, "etl_allowed": message.etl_allowed, "plid": message.pipelineId, "prj": message.project, "msg": message.state, "fid": message.flowId, "flrid": message.flowRunId, "lvl": level },
    rest
  );
  logEntry[MESSAGE] = JSON.stringify(json);
  return logEntry;
};

const errorJsonFormatter = (logEntry) => {
  const { name, message, stack, level, ...rest } = logEntry;
  const json = Object.assign(
    { "t": moment().toISOString(), "err": name, "msg": message, "stk": stack, "lvl": level }, rest
  );
  logEntry[ERROR_NAME, MESSAGE] = JSON.stringify(json);
  return logEntry;
};

const infoLogger = winston.createLogger({
  level: "info",
  format: winston.format(infoJsonFormatter)(),
  defaultMeta: {
    svc: require("../package.json").name,
    v: require("../package.json").version,
    host: require("os").hostname(),
    pid: process.pid
  },
  transports: infoTransport
});

const errorLogger = winston.createLogger({
  level: "error",
  format: winston.format(errorJsonFormatter)(),
  defaultMeta: {
    t: moment().toISOString(),
    svc: require("../package.json").name,
    v: require("../package.json").version,
    host: require("os").hostname(),
    pid: process.pid
  },
  transports: errorTransport
});

module.exports = { infoLogger, errorLogger };