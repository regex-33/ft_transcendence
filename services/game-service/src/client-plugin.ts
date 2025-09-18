import { PrismaClient } from "../generated/prisma"
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import fastifyPlugin from "fastify-plugin";

export default fastifyPlugin(async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
	const client = new PrismaClient();
	fastify.decorate('prisma', client);
	console.log("decorating the prisma client");

	fastify.addHook('onClose', (app) => {
		app.prisma.$disconnect();
	});
});
