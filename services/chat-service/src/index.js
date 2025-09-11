import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connections = new Map();
const fastify = Fastify({ logger: true });


fastify.register(cors, { origin: '*' });
fastify.register(websocket);

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
});


fastify.register(async function (fastify) {
  fastify.get('/ws/chat', { websocket: true }, (connection, req) => {
    const clientId = Date.now();
    console.log(` Client ${clientId} connected!`);
    connections.set(clientId, connection);
    connection.on('message', message => {
        const receivedMessage = message.toString();
        if (receivedMessage === 'ping') {
            connection.send('pong');
            return;
          }
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const dataToSend = {
        text: receivedMessage,
        time: timestamp
      };
      const jsonString = JSON.stringify(dataToSend);
      for (const clientConnection of connections.values()) {
        clientConnection.send(jsonString);
      }
    });

    connection.on('close', () => {
      connections.delete(clientId);
      console.log(`Client ${clientId} disconnected.`);
    });
  });
});

const start = async () => {
  try {
    const port = process.env.PORT || 8002;
    await fastify.listen({ port: port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
