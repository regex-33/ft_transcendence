import Redis from 'ioredis'
import dotenv from 'dotenv'
dotenv.config({
	path: '../.env'
});

const host = process.env.REDIS_HOST;
const port = Number(process.env.REDIS_PORT);
const password = process.env.REDIS_PASSWORD;
if (!host || !port || !password)
	throw new Error("redis options not set");

// const redis = new Redis({
// 	host,
// 	port,
// 	password,
// })
//

const redis = {}

export default redis
