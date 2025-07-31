const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");
const { User, Relationship } = db;

const validate = (reply, ...ids) => {
  const [userId, friendId] = ids.map((id) => parseInt(id, 10));

  if (!friendId || !userId) {
    fillObject(req, "WARNING", "addFriend", userId, false, "User ID and friend ID are required.", req.cookies?.token || null);
    return reply
      .status(400)
      .send({ error: "User ID and friend ID are required." });
  }
  if (!friendId || !/^\d+$/.test(friendId)) {
    fillObject(req, "WARNING", "addFriend", userId, false, "Invalid friend ID format.", req.cookies?.token || null);
    return reply.status(400).send({ error: "Invalid friend ID format." });
  }

  if (userId === parseInt(friendId, 10)) {
    fillObject(req, "WARNING", "addFriend", userId, false, "Cannot add yourself as a friend.", req.cookies?.token || null);
    return reply
      .status(400)
      .send({ error: "You cannot add yourself as a friend." });
  }
  return null;
};

const addFriend = async (request, reply) => {
  let check = checkAuthJWT(request, reply);
  if (check) return check;

  const id = request.user.id;
  const fid = request.body.id;

  check = validate(reply, id, fid);
  if (check) {
    fillObject(request, "WARNING", "addFriend", id, false, "invalid request", request.cookies?.token || null);
    return check;
  }
  let users;
  try {
    users = await User.findAll({
      where: {
        id: [id, fid],
      },
    });
    if (users.length !== 2) {
      fillObject(request, "WARNING", "addFriend", id, false, "users not found", request.cookies?.token || null);
      return reply.status(404).send({
        error: "User not found.",
      });
    }
  } catch (error) {
    fillObject(request, "ERROR", "addFriend", id, false, error.message, request.cookies?.token || null);
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
      fillObject(request, "WARNING", "addFriend", id, false, "friend request already exists", request.cookies?.token || null);
      return reply.status(400).send({
        message:
          "you can't send addfriend " + ((rel[0].status != "blocked")
            ? " two times"
            : "to this user"),
      });
    }
  } catch (error) {
    fillObject(request, "ERROR", "addFriend", id, false, error.message, request.cookies?.token || null);
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
    fillObject(request, "INFO", "addFriend", id, true, "", request.cookies?.token || null);
    reply.status(201).send();
  } catch (error) {
    fillObject(request, "ERROR", "addFriend", id, false, error.message, request.cookies?.token || null);
    reply.status(500).send({
      error: "An error occurred while sending the friend request.",
      details: error.message,
    });
  }
};

module.exports = addFriend;
