const db = require("../../models");
const checkAuthJWT = require("../../middleware/checkauthjwt");
const { User, Relationship } = db;

const validate = (reply, ...ids) => {
  const [userId, friendId] = ids.map((id) => parseInt(id, 10));
  if (!friendId || !userId) {
    return reply
      .status(400)
      .send({ error: "User ID and friend ID are required." });
  }
  if (!friendId || !/^\d+$/.test(friendId)) {
    return reply.status(400).send({ error: "Invalid friend ID format." });
  }

  if (userId === parseInt(friendId, 10)) {
    return reply
      .status(400)
      .send({ error: "You cannot add yourself as a friend." });
  }
  return null;
};

const addFriend = async (request, reply) => {
  let check = checkAuthJWT(request, reply);

  const id = 1 || request.user.id;
  const fid = 2 || request.body.id;

  check = check || validate(reply, id, fid);
  if (check) return check;

  try {
  const users = await User.findAll({
    where: {
      id: [id, fid],
    },
  });
  } catch (error) {
    return reply.status(500).send({
      error: "An error occurred while fetching users.",
      details: error.message,
    });
  }
  
  try {
    const rel = await Relationship.findAll({
      where: {
        [db.Sequelize.Op.and]: [
          { first: Math.min(id, fid) },
          { second: Math.max(id, fid) },
        ],
      },
    });
  } catch (error) {
    return reply.status(500).send({
      error: "An error occurred while checking relationships.",
      details: error.message,
    });
  }

  if (rel.length != 0) {
    reply.status(400).send({
      message: "you can't send addfriend two times",
    });
  }

  try {
    await Relationship.create({
      first: Math.min(id, fid),
      second: Math.max(id, fid),
    });
    // users.forEach((user) => {
  
    reply.status(200).send({
      message: "Friend request sent successfully",
    });
  } catch (error) {
    reply.status(500).send({
      error: "An error occurred while sending the friend request.",
      details: error.message,
    });
  }
};

module.exports = addFriend;
