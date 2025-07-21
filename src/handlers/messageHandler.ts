import { WebSocket } from 'ws';
import { pool } from '../db';

export async function loadOldMessages(ws: WebSocket) {
    const res = await pool.query("SELECT content FROM messages ORDER BY created_at ASC");
    res.rows.forEach((row: { content: string }) => {
      ws.send(row.content);
    });
  }

export async function handleMessage(msg:any, ws:WebSocket) {
    await pool.query('INSERT INTO messages (content) VALUES ($1)', [msg]);
    ws.send(msg);
}
