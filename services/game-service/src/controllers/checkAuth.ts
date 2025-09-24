import type { FastifyReply, FastifyRequest } from "fastify";

export const checkAuth = async function(request: FastifyRequest, reply: FastifyReply) {
	const sessionId = request.cookies?.session_id;
	const token = request.cookies?.token;
	if (!sessionId || !token)
		return reply.code(401).send({ error: "Unauthorized: session not found" });
	const cookies = "session_id=" + sessionId + ";token=" + token;
	try {
		const response = await fetch("http://transcendence-nginx/api/users/get/me",
			{
				headers: {
					Cookie: cookies
				}
			});
		if (!response.ok)
			return reply.code(401).send({ error: "Unauthorized: invalid credentials" });
		const data = await response.json() as User;
		if (!data || !data?.id)
			return reply.code(401).send({ error: "Unauthorized: invalid user" });
		(request as any).user = data;
	}
	catch (err) {
		return reply.code(401).send(err);
	}
}
