import log4js from "log4js";

// Setup our logger.
// First, see if Hajk is running in a clustered environment, if so, we want unique log file
// names for each instance
const uniqueInstance =
  process.env.HAJK_INSTANCE_ID.length > 0
    ? `_${process.env.HAJK_INSTANCE_ID}`
    : "";

const commonDateFileOptions = {
  compress: process.env.LOG_COMPRESS_BACKUPS === "true", // Should the backups be gzipped?
  numBackups: !isNaN(Number.parseInt(process.env.LOG_NUM_BACKUPS)) // Number of backup files to keep. Backups rotate on a daily basis.
    ? Number.parseInt(process.env.LOG_NUM_BACKUPS)
    : 14,
  mode: 0o644, // The mode in octal format. We want to give the read permission to everyone, hence 644.
};

// Next, configure the log4js singleton. Those settings will be available for
// all other imports of log4js in this project.
log4js.configure({
  // Appenders are output methods, e.g. if log should be written to file or console (or both)
  appenders: {
    // Console appender will print to stdout
    console: { type: "stdout" },
    // File appender will print to a log file, rotating it each day.
    file: {
      type: "dateFile",
      filename: `logs/output${uniqueInstance}.log`,
      ...commonDateFileOptions,
    },
    // Another file appender, specifically to log events that modify Hajk's layers/maps
    adminEventLog: {
      type: "dateFile",
      filename: `logs/admin_events${uniqueInstance}.log`,
      // Custom layout as we only care about the timestamp, the message and new line,
      // log level and log context are not of interest to this specific appender.
      layout: {
        type: "pattern",
        pattern: "[%d] %m",
      },
      ...commonDateFileOptions,
    },
    // Appender used for writing access logs. Rotates daily.
    accessLog: {
      type: "dateFile",
      filename: `logs/access${uniqueInstance}.log`,
      layout: { type: "messagePassThrough" },
      ...commonDateFileOptions,
    },
  },
  // Categories specify _which appender is used with respective logger_. E.g., if we create
  // a logger with 'const logger = log4js.getLogger("foo")', and there exists a "foo" category
  // below, the options (regarding appenders and log level to use) will be used. If "foo" doesn't
  // exist, log4js falls back to the "default" category.
  categories: {
    default: {
      // Use settings from .env to decide which appenders (defined above) will be active
      appenders: process.env.LOG_DEBUG_TO.split(","),
      // Use settings from .env to determine which log level should be used
      level: process.env.LOG_LEVEL,
    },
    // Separate category to log admin UI events (requests to endpoints that modify the layers/maps)
    ...(process.env.LOG_ADMIN_EVENTS === "true" && {
      adminEvent: {
        appenders: ["adminEventLog"],
        level: "all",
      },
    }),
    // If activated in .env, write access log to the configured appenders
    ...(process.env.LOG_ACCESS_LOG_TO.trim().length !== 0 && {
      http: {
        appenders: process.env.LOG_ACCESS_LOG_TO.split(","),
        level: "all",
      },
    }),
  },
});

// Finally, re-export
export default log4js;
