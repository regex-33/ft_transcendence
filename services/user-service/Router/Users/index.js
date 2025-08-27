module.exports = {
  login:require("./login"),
  logout:require("./logout"),
  register:require("./register"),
  ...require("./update"),
  online:require("./online"),
  ...require("./getters")
};