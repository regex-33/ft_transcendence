const db = require("../../models/");
const { User } = db;
const checkAuthJWT = require("../../middleware/checkauthjwt");
const multer = require("../../middleware/Multer");
const bcrypt = require("bcrypt");
const validation = (res, ...inputs) => {
  const [id, name, email, password, image, username] = inputs;
  if (name !== undefined && name.split(" ").length < 2) {
    return res
      .status(400)
      .send({ error: "Name must contain at least first and last name." });
  }
  if (
    name === undefined &&
    email === undefined &&
    password === undefined &&
    image === undefined
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
  const nameParts = name ? name.split(" ") : [];
  if (
    name &&
    (nameParts.length != 2 ||
      nameParts[0].length < 3 ||
      nameParts[1].length < 3)
  ) {
    return res
      .status(400)
      .send({ error: "Name must contain at least first and last name." });
  }
  if (password && password.length < 6) {
    return res
      .status(400)
      .send({ error: "Password must be at least 6 characters long." });
  }
  return null;
};
const updateUser = (req, res) => {
  const check = checkAuthJWT(req, res);
  if (check) return check;
  const { id } = req.user;
  console.log("parts", req.parts);
  multer(req)
    .then((body) => {
      const { username, name, email, password, image } = body;
      if (id != req.user.id) {
        return res
          .status(403)
          .send({ error: "You are not authorized to update this user." });
      }

      const validationError = validation(
        res,
        id,
        name,
        email,
        password,
        image ? image.path:undefined,
        username
      );

      if (validationError) return validationError;
      User.findByPk(id)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found." });
          }
          const updatedData = {};
          if (name) updatedData.name = name;
          if (email) updatedData.email = email;
          if (password) updatedData.password = bcrypt.hashSync(password, 10);
          if (image) updatedData.image = image.path;
          if (username) updatedData.username = username;
          if (image) updatedData.image = image.path;

          user
            .update(updatedData)
            .then(() => {
              res.send({
                message: "User updated successfully.",
              });
            })
            .catch((err) => {
              console.error("Error updating user:", err);
              res.status(500).send({ error: "Internal server error." });
            });
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          res.status(500).send({ error: "Internal server error." });
        });
    })
    .catch((err) => {
      console.error("Error processing multipart request:", err);
      res.status(500).send({ error: "Internal server error." });
    });
};

module.exports = updateUser;
