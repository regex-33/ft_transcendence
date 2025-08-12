const db = require("../../models/");
const { User } = db;
const checkAuthJWT = require("../../util/checkauthjwt");
const multer = require("../../util/Multer");
const bcrypt = require("bcrypt");


const validation = (res, ...inputs) => {
  const [id, email, password, image, username] = inputs;

  if (
    email === undefined &&
    password === undefined &&
    image === undefined &&
    username === undefined
  ) {
    return res
      .status(400)
      .send({ error: "At least one field must be provided for update." });
  }

  if (!/^\d+$/.test(id)) {
    return res.status(400).send({ error: "Invalid user ID format." });
  }

  if (username && !/^[a-zA-Z_]+$/.test(username)) {
    return res.status(400).send({
      error: "Username must contain only letters, numbers, and underscores.",
    });
  }

  if (email && !email.includes("@")) {
    return res.status(400).send({ error: "Invalid email format." });
  }

  return null;
};



/**
* update user info
*/
const updateUser = async (req, res) => {
    const { check, payload } = await checkAuthJWT(req, reply);
    if (check) return check;
    req.user = payload;
  const { id } = req.user;
  try {
    const body = await multer(req)
    const { username, email, password, image } = body;
    if (id != req.user.id) {
      return res
        .status(403)
        .send({ error: "You are not authorized to update this user." });
    }

    const validationError = validation(
      res,
      id,
      email,
      password,
      image ? image.path : undefined,
      username
    );

    if (validationError) {
      fillObject(req, "WARNING", "updateUser", id, false, validationError.message, req.cookies?.token || null);
      return validationError;
    }

    try {
      const user = await User.findByPk(id)
      if (!user) {
        fillObject(req, "WARNING", "updateUser", id, false, "User not found.", req.cookies?.token || null);
        return res.status(404).send({ error: "User not found." });
      }

      const updatedData = {};
      if (email) updatedData.email = email;
      if (password) updatedData.password = bcrypt.hashSync(password, 10);
      if (image) updatedData.image = image.path ? image.path : null;
      if (username) updatedData.username = username;
      try {
        await user
          .update(updatedData);
        res.send({
          message: "User updated successfully.",
        });
      }
      catch (err) {
        fillObject(req, "ERROR", "updateUser", id, false, err.message, req.cookies?.token || null);
        console.error("Error updating user:", err);
        res.status(500).send({ error: "Internal server error.7" });
      };
    }
    catch (err) {
      fillObject(req, "ERROR", "updateUser", id, false, err.message, req.cookies?.token || null);
      console.error("Error fetching user:", err);
      res.status(500).send({ error: "Internal server error.8" });
    };
  }
  catch (err) {
    fillObject(req, "ERROR", "updateUser", "unknown", false, err.message, req.cookies?.token || null);
    console.error("Error processing multipart request:", err);
    res.status(500).send({ error: "Internal server error.9" });
  };
};

module.exports = updateUser;
