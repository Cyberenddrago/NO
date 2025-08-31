import { RequestHandler } from "express";
import { User } from "../models/User";

export const handleDebugLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`\n🔍 Debug Login Attempt for: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    // Find user
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ],
      isActive: true
    }).select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log(`✅ User found: ${user.username}`);
    console.log(`📝 User ID: ${user.id}`);
    console.log(`🔐 Password in DB: ${user.password.substring(0, 20)}...`);
    console.log(`🔒 Is password hashed: ${user.isPasswordHashed()}`);
    console.log(`🔓 Is account locked: ${user.isLocked()}`);
    console.log(`🔢 Login attempts: ${user.loginAttempts}`);
    
    // Test password comparison
    let passwordValid = false;
    try {
      passwordValid = await user.comparePassword(password);
      console.log(`✅ Password comparison result: ${passwordValid}`);
    } catch (error) {
      console.log(`❌ Password comparison error: ${error.message}`);
    }
    
    // If password is valid but not hashed, show migration info
    if (passwordValid && !user.isPasswordHashed()) {
      console.log(`🔄 This user needs password migration on next successful login`);
    }
    
    res.json({
      username: user.username,
      userId: user.id,
      name: user.name,
      role: user.role,
      isPasswordHashed: user.isPasswordHashed(),
      passwordValid,
      isLocked: user.isLocked(),
      loginAttempts: user.loginAttempts,
      needsMigration: passwordValid && !user.isPasswordHashed(),
      passwordPrefix: user.password.substring(0, 20) + '...'
    });
    
  } catch (error) {
    console.error('Debug login error:', error);
    res.status(500).json({ error: "Debug login failed: " + error.message });
  }
};
