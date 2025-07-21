import { WebSocketServer, WebSocket } from 'ws';
import { loadOldMessages, handleMessage } from './handlers/messageHandler';

const server = new WebSocketServer({ port: 8080 });

server.on('connection', async (ws: WebSocket) => {
    console.log('New connection');
    await loadOldMessages(ws);
    ws.on('message', async (msg: string) => {
        await handleMessage(msg.toString(), ws);
    });
});