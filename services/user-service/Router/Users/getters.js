const db = require("../../models");
const checkAuthJWT = require("../../util/checkauthjwt");
const { usernamevalid} = require("../../util/validaters");
/**
   * return user obj,
   * get user by username
   */
const getbyusername = async (request, reply) => {
  const { check ,payload} = await checkAuthJWT(request, reply);
  if (check) return check;

  if (!request.params ) {
    return reply.status(400).send({ error: "Username is required." });
  }

  const { username } = request.params;

  if (!usernamevalid(username)) {
    return reply.status(400).send({ error: "Invalid username format." });
  }

  try {

    const user = await db.User.findOne({
      where: { username },
      include: [{ model: db.Session, as: 'sessions' }]
    });
    if (!user || !user.valid) {
      return reply.status(404).send({ error: "User not found." });
    }
    let n = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      online: user.sessions.filter(session => session.counter > 0).length > 0,
      location: user.location,
      birthday: user.birthday
    }
    const relationship = await db.Relationship.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { userId: payload.id, otherId: user.id },
          { userId: user.id, otherId: payload.id }
        ]
      }
    });
    if (relationship) {
      n.status = relationship.status;
      if (relationship.status === 'blocked' && relationship.otherId === payload.id) {
        return reply.status(404).send({ error: "User not found." });
      }
      if (relationship.status === 'pending' && relationship.userId === payload.id) {
        n.status = 'request';
      }
    }
    return reply.send(n);
  }
  catch (err) {
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
    return reply.status(400).send({ error: "User ID is required." });
  }

  if (!/^\d+$/.test(id)) {
    return reply.status(400).send({ error: "Invalid user ID format." });
  }
  try {
    const user = await db.User.findByPk(id, { include: [{ model: db.Session, as: 'sessions' }] });
    if (!user || !user.valid) {
      return reply.status(404).send({ error: "User not found." });
    }
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
      return reply.status(404).send({ error: "User not found." });
    }
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
    console.error("Error fetching user by ID:", err);
    reply.status(500).send({ error: "Internal server error." });
  };
};

/**
   * return  all users objs,
   * 
   */
const getUsers = async (request, reply) => {
  const { check, payload } = await checkAuthJWT(request, reply);
  if (check) return check;
  try {
    const users = await db.User.findAll({
      include: [
        { model: db.Session, as: 'sessions' }
      ]
    });
    if (!users || users.length === 0) {
      return reply.status(404).send({ error: "No users found." });
    }

    const userList = await Promise.all(
      users.filter(user => user.valid).map(async (user) => {
        const rel = await db.Relationship.findOne({
          where: {
            [db.Sequelize.Op.or]: [
              { userId: payload.id, otherId: user.id },
              { userId: user.id, otherId: payload.id }
            ]
          }
        });
        if (user.id === payload.id || (rel && rel.status === 'blocked' && rel.otherId === payload.id)) return null;
        if (rel && rel.status === 'pending' && rel.userId === payload.id) {
          rel.status = 'request';
        }
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          status: rel ? rel.status : null,
          online: user.sessions.filter(session => session.counter > 0).length > 0,
          location: user.location,
          birthday: user.birthday
        };
      })
    );
    return reply.send(userList.filter(u => u));
  }
  catch (err) {
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
