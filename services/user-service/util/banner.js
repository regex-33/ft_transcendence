const arrayOfClients = new Map();
const arrayOfBannedClients = new Set();
const CLEANUP_INTERVAL = Number(process.env.CLEANUP_INTERVAL) || 300000; 
let lastCleanup = Date.now();

const banner =  (request, reply, done) => {
  const now = Date.now();
  const clientIp = request.ip;

  if (arrayOfBannedClients.has(clientIp)) {
    return reply.status(403).send({ error: "You are banned" });
  }

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    arrayOfClients.clear();
    lastCleanup = now;
  }

  const TIME_BTWN_REQUESTS = Number(process.env.TIME_BTWN_REQUESTS) || 3000;
  const MAX_REQUESTS = Number(process.env.NUMBER_OF_REQUESTS_TO_BAN) || 10;

  const client = arrayOfClients.get(clientIp);
  if (client) {
    if (now - client.time < TIME_BTWN_REQUESTS) {
      client.count++;
    } else {
      client.count = 1;
      client.time = now;
    }

    if (client.count >= MAX_REQUESTS) {
      arrayOfBannedClients.add(clientIp);
      return reply.status(429).send({ error: "Too many requests - Banned" });
    }

    arrayOfClients.set(clientIp, client);
  } else {
    arrayOfClients.set(clientIp, {
      time: now,
      count: 1,
    });
  }

  done(); 
}

module.exports = banner;
