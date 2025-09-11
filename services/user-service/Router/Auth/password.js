// services/user-service/Router/Auth/password.js
const db = require("../../models");
const bcrypt = require("bcrypt");
const checkAuthJWT = require("../../util/checkauthjwt");
const { fillObject } = require("../../util/logger");

// Validate current password
const validatePassword = async (req, res) => {
  try {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;
    const { password } = req.body;

    if (!password) {
      fillObject(req, "WARNING", "validatePassword", username, false, "Password is required", req.cookies?.token || null);
      return res.status(400).send({ error: "Password is required" });
    }

    // Get user from database
    const user = await db.User.findByPk(id);
    if (!user || !user.valid) {
      fillObject(req, "WARNING", "validatePassword", username, false, "User not found", req.cookies?.token || null);
      return res.status(404).send({ error: "User not found" });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      fillObject(req, "INFO", "validatePassword", username, true, "Password validated", req.cookies?.token || null);
      res.status(200).send({ valid: true, message: "Password is correct" });
    } else {
      fillObject(req, "WARNING", "validatePassword", username, false, "Invalid password", req.cookies?.token || null);
      res.status(200).send({ valid: false, message: "Password is incorrect" });
    }
  } catch (err) {
    fillObject(req, "ERROR", "validatePassword", "unknown", false, err.message, req.cookies?.token || null);
    console.error("Error validating password:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { check, payload } = await checkAuthJWT(req, res);
    if (check) return check;
    req.user = payload;
    const { id, username } = req.user;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      fillObject(req, "WARNING", "changePassword", username, false, "Current and new password are required", req.cookies?.token || null);
      return res.status(400).send({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      fillObject(req, "WARNING", "changePassword", username, false, "Password too short", req.cookies?.token || null);
      return res.status(400).send({ error: "New password must be at least 6 characters long" });
    }

    if (currentPassword === newPassword) {
      fillObject(req, "WARNING", "changePassword", username, false, "Same password", req.cookies?.token || null);
      return res.status(400).send({ error: "New password must be different from current password" });
    }

    // Get user from database
    const user = await db.User.findByPk(id);
    if (!user || !user.valid) {
      fillObject(req, "WARNING", "changePassword", username, false, "User not found", req.cookies?.token || null);
      return res.status(404).send({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      fillObject(req, "WARNING", "changePassword", username, false, "Invalid current password", req.cookies?.token || null);
      return res.status(400).send({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    fillObject(req, "INFO", "changePassword", username, true, "Password changed successfully", req.cookies?.token || null);
    res.status(200).send({ message: "Password changed successfully" });
  } catch (err) {
    fillObject(req, "ERROR", "changePassword", "unknown", false, err.message, req.cookies?.token || null);
    console.error("Error changing password:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

// Generate password reset token (for email-based reset)
const generateResetToken = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      fillObject(req, "WARNING", "generateResetToken", "unknown", false, "Email is required", null);
      return res.status(400).send({ error: "Email is required" });
    }

    // Check if user exists
    const user = await db.User.findOne({ where: { email } });
    if (!user || !user.valid) {
      // Don't reveal if email exists or not for security
      fillObject(req, "WARNING", "generateResetToken", "unknown", false, "Email not found", null);
      return res.status(200).send({ message: "If the email exists, a reset code will be sent" });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store reset code (remove any existing codes for this email)
    await db.ResetCode.destroy({ where: { email } });
    await db.ResetCode.create({ email, code: resetCode });

    // Here you would typically send the reset code via email
    // For now, we'll just log it (remove this in production)
    console.log(`Reset code for ${email}: ${resetCode}`);

    fillObject(req, "INFO", "generateResetToken", user.username, true, "Reset code generated", null);
    res.status(200).send({ message: "If the email exists, a reset code will be sent" });
  } catch (err) {
    fillObject(req, "ERROR", "generateResetToken", "unknown", false, err.message, null);
    console.error("Error generating reset token:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

// Reset password using reset code
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      fillObject(req, "WARNING", "resetPassword", "unknown", false, "Missing required fields", null);
      return res.status(400).send({ error: "Email, code, and new password are required" });
    }

    if (newPassword.length < 6) {
      fillObject(req, "WARNING", "resetPassword", "unknown", false, "Password too short", null);
      return res.status(400).send({ error: "New password must be at least 6 characters long" });
    }

    // Check if reset code exists and is valid
    const resetCode = await db.ResetCode.findOne({ where: { email, code } });
    if (!resetCode) {
      fillObject(req, "WARNING", "resetPassword", "unknown", false, "Invalid reset code", null);
      return res.status(400).send({ error: "Invalid or expired reset code" });
    }

    // Check if code is not too old (optional - add createdAt check)
    const codeAge = Date.now() - new Date(resetCode.createdAt).getTime();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    if (codeAge > maxAge) {
      await db.ResetCode.destroy({ where: { email, code } });
      fillObject(req, "WARNING", "resetPassword", "unknown", false, "Reset code expired", null);
      return res.status(400).send({ error: "Reset code has expired" });
    }

    // Find user and update password
    const user = await db.User.findOne({ where: { email } });
    if (!user || !user.valid) {
      fillObject(req, "WARNING", "resetPassword", "unknown", false, "User not found", null);
      return res.status(400).send({ error: "User not found" });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    // Remove used reset code
    await db.ResetCode.destroy({ where: { email, code } });

    fillObject(req, "INFO", "resetPassword", user.username, true, "Password reset successfully", null);
    res.status(200).send({ message: "Password reset successfully" });
  } catch (err) {
    fillObject(req, "ERROR", "resetPassword", "unknown", false, err.message, null);
    console.error("Error resetting password:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

module.exports = {
  validatePassword,
  changePassword,
  generateResetToken,
  resetPassword
};
