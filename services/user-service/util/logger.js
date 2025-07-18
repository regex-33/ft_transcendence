const fs = require('fs')
const log = (jsonMessage) => {
    const logDir = `/var/log/${jsonMessage.service}`;
    if (!fs.existsSync(logDir))
        fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(`${logDir}/${jsonMessage.service}.log`, JSON.stringify(jsonMessage) + '\n');
};


const fillObject = (req, ...obj) => {
    req.object = {
        ...req.object,
        ...obj
    };
    return req;
};

module.exports = {
    log,
    fillObject
};