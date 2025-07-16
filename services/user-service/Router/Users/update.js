const db = require("../../models/");
const { User } = db;
const checkAuthJWT = require("../../middleware/checkauthjwt");
const multer = require("../../middleware/Multer");
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
  const check = checkAuthJWT(req, res);
  if (check) return check;

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

    if (validationError) return validationError;

    try {
      const user = await User.findByPk(id)
      if (!user) {
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
        console.error("Error updating user:", err);
        res.status(500).send({ error: "Internal server error." });
      };
    }
    catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).send({ error: "Internal server error." });
    };
  }
  catch (err) {
    console.error("Error processing multipart request:", err);
    res.status(500).send({ error: "Internal server error." });
  };
};

module.exports = updateUser;
