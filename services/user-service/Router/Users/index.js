module.exports = {
  login:require("./login"),
  logout:require("./logout"),
  register:require("./register"),
  updateUser:require("./update"),
  online:require("./online"),
  ...require("./getters")
}; 