
const fs = require("fs");
const logDir = "/var/log/catchs";
const logFile = logDir + "/catchs.log";

fs.mkdirSync(logDir, { recursive: true });

function logError(message = "error") {
  const now = new Date();
  const timestamp = now.toISOString().replace("T", " ");

  const logEntry = 
  `============================\n
                    ${message}\n
                    ${timestamp}\n
  ================================\n`;

  fs.appendFileSync(logFile, logEntry, "utf8");
}

module.exports = logError;
