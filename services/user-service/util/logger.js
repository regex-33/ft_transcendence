const { v4: uuidv4 } = require('uuid');
const log = (message, service, level = 'info',action, username,success=true,request,response) => {
    const jsonMessage = {
        timestamp: new Date().toISOString(),
        service,
        level,
        action,
        request_id: uuidv4(),
        session_id: uuidv4(),
        username,
        success ,
        request:{
            method: request.method,
            url: request.url,
            ip: request.ip,
            user_agent: request.headers['user-agent'],
        },
        response:{
            status:response.statusCode,
            "duration": Date.now() - request.timeStart ,
        }
    };
    console[level](JSON.stringify(jsonMessage));
};

module.exports = log;
