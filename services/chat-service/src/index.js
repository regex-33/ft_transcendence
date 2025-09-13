import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify();
fastify.register(websocket);
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:8080'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
});


fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', '/public'),
});

const clients = new Map();
const userFriends = new Map();
const blockedUsers = new Map();


function add_connection(userId, connection) 
{
  if (!clients.has(userId)) clients.set(userId, []);
    clients.get(userId).push(connection);
}

function remove_connection(userId, connection) 
{
  if (!clients.has(userId)) 
      return;
  const remaining = clients.get(userId).filter(c => c !== connection);
  if (remaining.length > 0) clients.set(userId, remaining);
  else {
    clients.delete(userId);
    broadcast_offline(userId);
  }
}

function set_user_friends(userId, friends) 
{
  const blocked = blockedUsers.get(userId) || [];
  userFriends.set(userId, friends.filter(f => !blocked.includes(f.id)));
}

function broadcast_online(userId) 
{
  const friends = userFriends.get(userId) || [];
  const online_friends = friends.filter(f => clients.has(f.id));

  const userConns = clients.get(userId) || [];
  userConns.forEach(conn => {
    conn.send(JSON.stringify({ type: "status", online: online_friends }));
  });

  online_friends.forEach(friend => {
    const friendConns = clients.get(friend.id) || [];
    friendConns.forEach(conn => {
      const friendList = (userFriends.get(friend.id) || []).filter(f => clients.has(f.id) && f.id !== friend.id);
      conn.send(JSON.stringify({ type: "status", online: friendList }));
    });
  });
}

function broadcast_offline(userId) 
{
  const friends = userFriends.get(userId) || [];
  friends.forEach(friend => {
    if (clients.has(friend.id)) {
      const friendConns = clients.get(friend.id);
      friendConns.forEach(conn => {
        conn.send(JSON.stringify({ type: "status", offline: [{ id: userId }] }));
      });
    }
  });
}

function broadcast_all(data_send) {
  const conns = clients.get(data_send.to) || [];
  conns.forEach(i => i.readyState === i.OPEN && i.send(JSON.stringify(data_send)));

  const fromConns = clients.get(data_send.from) || [];
  fromConns.forEach(i => i.readyState === i.OPEN && i.send(JSON.stringify(data_send)));
}


fastify.get('/api/chat/me', async (req, reply) => {
  try {
    const cookie = req.headers.cookie || '';
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
    const res = await fetch(`${userServiceUrl}/api/users/get/me`, {
      headers: { cookie },
    });
    if (!res.ok) return reply.status(res.status).send({ error: 'Cannot fetch user info' });

    const user = await res.json();
    reply.send(user);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Server error fetching user info' });
  }
});

fastify.get('/api/chat/friends', async (req, reply) => {
  try {
    const cookie = req.headers.cookie || '';
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
    
    const res = await fetch(`${userServiceUrl}/api/friends/friends`, {
      headers: { cookie },
    });
    if (!res.ok) return reply.status(res.status).send({ error: 'Cannot fetch friends' });
    
    const data = await res.json();
    console.log("friend is : ", data)
    const friends = data.map(f => ({
      id: f.id,
      name: f.username,
      image: f.avatar
    }));
    reply.send(friends);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Cannot fetch friends' });
  }
});

fastify.get('/api/chat/messages/:userId', async (req, reply) => {
  const userId = parseInt(req.params.userId);
  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ fromId: userId }, { toId: userId }] },
      orderBy: { time: 'asc' }
    });
    reply.send(messages);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Cannot fetch messages" });
  }
});

fastify.get('/api/chat/blocked/:id', async (req, reply) => {
  try {
    const cookie = req.headers.cookie || '';
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
    const res = await fetch(`${userServiceUrl}/api/friends/rel/${req.params.id}`, {
      headers: { cookie },
    });
    if (!res.ok) return reply.status(res.status).send({ error: 'Cannot fetch blocked users' });
    const data = await res.json();
    console.log("data blocked is ", data)
    reply.send(data);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ error: 'Server error fetching blocked users' });
  }
});

fastify.register(async function (fastify){
  fastify.get('/ws/chat', { websocket: true }, (connection) => {
    console.log("jaaaaaaat connection")
    connection.on('message', async (message) => {
      console.log("ja message")
      const now = new Date();
      const hours = String(now.getHours()).padStart(2,'0');
      const minutes = String(now.getMinutes()).padStart(2,'0');

      const data = JSON.parse(message);

      if (Array.isArray(data.friends)) set_user_friends(data.id, data.friends);

      if (data.type === 'user-info') {
        connection.userId = data.id;
        add_connection(data.id, connection);
        broadcast_online(data.id);
      }

      if (data.type === 'message') {
        const fromId = data.from;
        const toId = data.to;

        const blocked = blockedUsers.get(toId) || [];
        if (blocked.includes(fromId)) return;

        const data_send = {
          type: 'message',
          from: fromId,
          to: toId,
          message: data.message,
          time: `${hours}:${minutes}`,
        };
        broadcast_all(data_send);

        try {
          await Promise.all([
            prisma.user.upsert(
              { where: 
                { 
                  id: fromId 
                }, 
                update: 
                { 
                  name: String(fromId) 
                }, 
                create: 
                { 
                  id: fromId, 
                  name: String(fromId) 
                } 
              }
            ),
            prisma.user.upsert({ where: { id: toId }, update: { name: String(toId) }, create: { id: toId, name: String(toId) } }),
          ]);

          await prisma.message.create({
            data: { text: data.message, time: now, fromId, toId }
          });
        } catch(err) {
          console.error("Database error:", err);
        }
      }

      if (data.type === 'ping') connection.send(JSON.stringify({ type: 'pong' }));
    });

    connection.on('close', () => { if (connection.userId) remove_connection(connection.userId, connection); });
  });
});

const start = async () => {
  try {
    const port = process.env.PORT || 8002;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
