import { Prisma, PrismaClient } from "../generated/prisma"
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import fastifyPlugin from "fastify-plugin";

export const prismaClient = new PrismaClient();

export default fastifyPlugin(async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
	const client = prismaClient;
	fastify.decorate('prisma', client);
	//console.log("decorating the prisma client");

	fastify.addHook('onClose', (app) => {
		app.prisma.$disconnect();
	});
});
