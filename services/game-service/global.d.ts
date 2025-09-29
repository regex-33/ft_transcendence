import { PrismaClient } from "@prisma/client";
import "fastify";
import type { UserData } from "./src/controllers/playerController";

declare module "fastify" {
	interface FastifyInstance {
		prisma: PrismaClient;
	}
}

declare module "fastify"
{
	interface FastifyRequest
	{
		user: UserData;
	}
}