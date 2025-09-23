import type { PrismaClient, Prisma } from "../../generated/prisma";

const createPlayer = async (db: PrismaClient | Prisma.TransactionClient, data: { id: number }) => {
	const player = await db.player.upsert({
		where: { userId: data.id },
		update: {},
		create: { userId: data.id }
	});
	return player;
};

export { createPlayer }
