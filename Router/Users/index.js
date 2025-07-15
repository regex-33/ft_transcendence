module.exports = {
  login:require("./login"),
  register:require("./Users/register"),
  updateUser:require("./Users/update"),
  ...require("./Users/getters")
}; 