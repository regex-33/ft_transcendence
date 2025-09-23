const fs = require('fs');
const log_infile = (jsonMessage) => {
    const logDir = `/var/log/${jsonMessage.service}`;
    if (!fs.existsSync(logDir))
        fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(`${logDir}/${jsonMessage.service}.log`, JSON.stringify(jsonMessage) + '\n');
};

const logger = (req, ...obj) => {
    try {
        if (req)
            log_infile({
                ...req?.object,
                ... {
                    level: obj[0] || 'INFO',
                    action: obj[1] || 'unknown',
                    username: obj[2] || 'unknown',
                    success: obj[3] || false,
                    error: {error_message:obj[4] || undefined},
                    session_id: obj[5] || undefined,
                },
                service: (obj[1] == 'FileSaving') ? 'file-service' : "user-service",
                response: {
                    statusCode: obj[6] || 200,
                    duration: Date.now() - req.object.startTime,
                }
            });
    } catch (err) {
    }
    return req;
};

module.exports = {
    log_infile,
    logger
};
