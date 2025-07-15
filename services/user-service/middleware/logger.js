const logger = async (request, reply) => {
  console.log(
    `[${new Date().toISOString()}] ${request.method} ${request.url}  - ${
      reply.statusCode
    }`
  );
};

module.exports = logger;
