import type { PrismaClient } from "../../generated/prisma";

const createPlayer = async (db: PrismaClient, data: { id: number }) => {
	const user = {} // fetch from users service
	const player = await db.player.upsert({
		where: { userId: data.id },
		update: {},
		create: { userId: data.id }
	});
	return player;
};

export { createPlayer }
