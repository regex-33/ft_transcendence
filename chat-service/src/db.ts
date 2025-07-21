import { Pool } from 'pg';

export const pool = new Pool({
    user: 'duva',
    host: 'localhost',
    database: 'chat',
    password: '',
    port: 5432,
});