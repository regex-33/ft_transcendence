const rel = require("./rel");

module.exports = {
  addFriend:require("./addFriend"),
  ...require("./getFriends"),
  actionsHandler:require("./actionsHandler"),
  rel:require("./rel"),
}  