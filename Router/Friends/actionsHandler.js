
// accept
// reject
// block

const actionsHandler = (req, reply) => {
        return reply.status(501).send({ error: "This endpoint is not implemented yet." });
  const { action, id } = req.body;
  const userId = req.user.id;

  if (!action || !id) {
    return reply.status(400).send({ error: "Action and ID are required." });
  }

  if (action === "accept") {
    // Logic to accept a friend request
    return reply.status(200).send({ message: "Friend request accepted." });
  } else if (action === "reject") {
    // Logic to reject a friend request
    return reply.status(200).send({ message: "Friend request rejected." });
  } else if (action === "block") {
    // Logic to block a user
    return reply.status(200).send({ message: "User blocked." });
  } else {
    return reply.status(400).send({ error: "Invalid action." });
  }
}

module.exports = actionsHandler;
