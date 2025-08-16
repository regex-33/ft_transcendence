module.exports = (reply,token) => {
  reply.setCookie("token", token, {
    httpOnly: process.env.NODE_ENV === "production",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });
  return reply;
}