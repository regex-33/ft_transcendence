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
  let users;
  try {
    users = await User.findAll({
      where: {
        id: [id, fid],
      },
    });
    if (users.length !== 2) {
      return reply.status(404).send({
        error: "User not found.",
      });
    }
  } catch (error) {
    return reply.status(500).send({
      error: "An error occurred while fetching users.",
      details: error.message,
    });
  }

  try {
    const rel = await Relationship.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { from: id, to: fid },
          { to: id, from: fid },
        ],
      },
    });
    if (rel.length != 0) {
      return reply.status(400).send({
        message:
          "you can't send addfriend " + ((rel[0].status != "blocked")
            ? " two times"
            : "to this user"),
      });
    }
  } catch (error) {
    return reply.status(500).send({
      error: "An error occurred while checking relationships.",
      details: error.message,
    });
  }

  try {
    const rel = await Relationship.create({
      from: id,
      to: fid,
      creator: id,
    });
    await Promise.all(
      users.map((user) => {
        return user.update({ friends: user.friends + 1 });
      })
    );

    reply.status(201).send(rel);
  } catch (error) {
    reply.status(500).send({
      error: "An error occurred while sending the friend request.",
      details: error.message,
    });
  }
};

module.exports = addFriend;
