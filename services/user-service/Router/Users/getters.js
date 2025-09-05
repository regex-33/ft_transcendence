const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

/**
   * return user obj,
   * get user by username
   */
const getbyusername = async (request, reply) => {
  const { check } = await checkAuthJWT(request, reply);
  if (check) return check;

  if (!request.params || !request.params.username) {
    fillObject(request, "WARNING", "getbyusername", "unknown", false, "Username is required.", request.cookies?.token || null);
    return reply.status(400).send({ error: "Username is required." });
  }

  const { username } = request.params;

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    fillObject(request, "WARNING", "getbyusername", "unknown", false, "Invalid username format.", request.cookies?.token || null);
    return reply.status(400).send({ error: "Invalid username format." });
  }

  try {

    const user = await db.User.findOne({
      where: { username },
      include: [{ model: db.Session, as: 'sessions' }]
    });
    if (!user || !user.valid) {
      fillObject(request, "WARNING", "getbyusername", "unknown", false, "User not found.", request.cookies?.token || null);
      return reply.status(404).send({ error: "User not found." });
    }
    fillObject(request, "INFO", "getbyusername", user.id, true, "", request.cookies?.token || null);
    reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      online: user.sessions.filter(session => session.counter > 0).length > 0,
      location: user.location,
      birthday: user.birthday
    });
  }
  catch (err) {
    fillObject(request, "ERROR", "getbyusername", "unknown", false, err.message, request.cookies?.token || null);
    console.error("Error fetching user by username:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};


/**
   * return user obj,
   * get user by id
   */
const getbyId = async (request, reply) => {
  const { check } = await checkAuthJWT(request, reply);
  if (check) return check;
  let { id } = request.params;
  if (!id) {
    fillObject(request, "WARNING", "getbyId", "unknown", false, "User ID is required.", request.cookies?.token || null);
    return reply.status(400).send({ error: "User ID is required." });
  }

  if (!/^\d+$/.test(id)) {
    fillObject(request, "WARNING", "getbyId", "unknown", false, "Invalid user ID format.", request.cookies?.token || null);
    return reply.status(400).send({ error: "Invalid user ID format." });
  }
  try {
    const user = await db.User.findByPk(id, { include: [{ model: db.Session, as: 'sessions' }] });
    if (!user || !user.valid) {
      fillObject(request, "WARNING", "getbyId", id, false, "User not found.", request.cookies?.token || null);
      return reply.status(404).send({ error: "User not found." });
    }
    fillObject(request, "INFO", "getbyId", user.id, true, "", request.cookies?.token || null);
    return reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      online: user.sessions.filter(session => session.counter > 0).length > 0,
      location: user.location,
      birthday: user.birthday
    });
  }
  catch (err) {
    fillObject(request, "ERROR", "getbyId", id, false, err.message, request.cookies?.token || null);
    console.error("Error fetching user by ID:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};



const getme = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return;
  request.user = payload;
  let { id } = request.user;
  try {
    const user = await db.User.findByPk(id, { include: [{ model: db.Session, as: 'sessions' }] });
    if (!user || !user.valid) {
      fillObject(request, "WARNING", "getbyId", id, false, "User not found.", request.cookies?.token || null);
      return reply.status(404).send({ error: "User not found." });
    }
    fillObject(request, "INFO", "getbyId", user.id, true, "", request.cookies?.token || null);
    return reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      online: user.sessions.filter(session => session.counter > 0).length > 0,
      location: user.location,
      birthday: user.birthday
    });
  }
  catch (err) {
    fillObject(request, "ERROR", "getbyId", id, false, err.message, request.cookies?.token || null);
    console.error("Error fetching user by ID:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};

/**
   * return  all users objs,
   * 
   */
const getUsers = async (request, reply) => {
  const { check } = await checkAuthJWT(request, reply);
  if (check) return check;
  try {
    const users = await db.User.findAll({ include: [{ model: db.Session, as: 'sessions' }] });
    if (!users || users.length === 0) {
      fillObject(request, "WARNING", "getUsers", "unknown", false, "No users found.", request.cookies?.token || null);
      return reply.status(404).send({ error: "No users found." });
    }
    fillObject(request, "INFO", "getUsers", "unknown", true, "", request.cookies?.token || null);
    return reply.send(
      users.map((user) => {
        if (user.valid)
          return ({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            online: user.sessions.filter(session => session.counter > 0).length > 0,
            location: user.location,
            birthday: user.birthday
          });
      })
    );
  }
  catch (err) {
    fillObject(request, "ERROR", "getUsers", "unknown", false, err.message, request.cookies?.token || null);
    console.error("Error fetching users:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};

module.exports = {
  getbyusername,
  getbyId,
  getUsers,
  getme
};
