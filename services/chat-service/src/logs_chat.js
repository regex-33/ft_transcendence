import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'Logs', 'chat-messages');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
export const logMessage = (log) => {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level: log.level || 'INFO',
    message: log.message || '',
    service: 'chat-service',
    action: log.action || 'unknown',
    user_id: log.user_id,
    username: log.username,
    to: log.to,
  };
  console.log("Logging to file:", entry, "---",logDir);
  fs.appendFileSync(path.join(logDir, 'chat.log'), JSON.stringify(entry) + '\n');
};
