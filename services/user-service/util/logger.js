// const { v4: uuidv4 } = require('uuid');
// const fs = require('fs')
// const log = ({service, level,action, username,success,request,response,error,session_id}) => {
//     if (!level)
//         level = "INFO";
//     if(!service)
//         service = "user-service";

//     const jsonMessage = {
//         timestamp: new Date().toISOString(),
//         service,
//         level,
//         action,
//         request_id: `${service}-${username}-${uuidv4()}`,
//         session_id,
//         username,
//         success ,
//         request:{
//             method: request.method,
//             url: request.url,
//             ip: request.ip,
//             user_agent: request.headers['user-agent'],
//         },
//         response:{
//             status:response.statusCode,
//             "duration": Date.now() - request.timeStart ,
//         },
//         error
//     };
//     // /var/log/{service}
//     const logDir = `/var/log/${service}`;
//     if (!fs.existsSync(logDir)) {
//         fs.mkdirSync(logDir, { recursive: true });
//     }
//     const logFile = `${logDir}/app.log`;
//     fs.appendFileSync(logFile, JSON.stringify(jsonMessage) + '\n');
// };

// module.exports = log;
