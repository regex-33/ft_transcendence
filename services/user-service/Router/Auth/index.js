// services/user-service/Router/Auth/index.js
const { getSessions, terminateSession, terminateAllOtherSessions } = require('./sessions');
const { validatePassword, changePassword, generateResetToken, resetPassword } = require('./password');

async function AuthRoutes(fastify) {
  // Session management routes
  fastify.get("/sessions", getSessions);
  fastify.delete("/sessions/:sessionId", terminateSession);
  fastify.delete("/sessions", terminateAllOtherSessions);

  // Password management routes
  fastify.post("/validate-password", validatePassword);
  fastify.post("/change-password", changePassword);
  fastify.post("/forgot-password", generateResetToken);
  fastify.post("/reset-password", resetPassword);
}

module.exports = { AuthRoutes };

// ================================
// UPDATE services/user-service/Router/index.js
// Add this to your existing router index file:

// const { AuthRoutes } = require("./Auth");

// In your main router registration function, add:
// fastify.register(AuthRoutes, { prefix: "/api/auth" });

// ================================
// USAGE EXAMPLES:

/*
Session Management:
- GET /api/auth/sessions - Get all active sessions
- DELETE /api/auth/sessions/:sessionId - Terminate specific session
- DELETE /api/auth/sessions - Terminate all other sessions

Password Management:
- POST /api/auth/validate-password - Validate current password
  Body: { password: "currentPassword" }
  
- POST /api/auth/change-password - Change password
  Body: { currentPassword: "old", newPassword: "new" }
  
- POST /api/auth/forgot-password - Generate reset code
  Body: { email: "user@example.com" }
  
- POST /api/auth/reset-password - Reset password with code
  Body: { email: "user@example.com", code: "123456", newPassword: "new" }
*/
