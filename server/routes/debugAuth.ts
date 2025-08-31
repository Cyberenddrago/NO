import { RequestHandler } from "express";
import { listAllUsers, resetUserPassword, testPasswordComparison, fixAllPasswords } from "../utils/adminUtils";

export const handleListUsers: RequestHandler = async (req, res) => {
  try {
    const users = await listAllUsers();
    res.json({
      message: "User list retrieved",
      totalUsers: users.length,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        passwordHashed: user.password.startsWith('$2a$'),
        passwordLength: user.password.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to list users" });
  }
};

export const handleTestLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    const isValid = await testPasswordComparison(username, password);
    res.json({
      message: `Password test for ${username}`,
      username,
      passwordValid: isValid
    });
  } catch (error) {
    res.status(500).json({ error: "Password test failed" });
  }
};

export const handleFixPasswords: RequestHandler = async (req, res) => {
  try {
    await fixAllPasswords();
    res.json({
      message: "All passwords have been reset to their original values",
      note: "All users can now login with their original passwords"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fix passwords" });
  }
};

export const handleResetPassword: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    const success = await resetUserPassword(username, password);
    if (success) {
      res.json({ message: `Password reset for user ${username}` });
    } else {
      res.status(404).json({ error: `User ${username} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: "Password reset failed" });
  }
};
