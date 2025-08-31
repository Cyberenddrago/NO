import { RequestHandler } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

export const handleFixAdminPassword: RequestHandler = async (req, res) => {
  try {
    console.log('🔧 Fixing admin password...');
    
    // Find admin user
    const adminUser = await User.findOne({ username: 'vinesh' }).select('+password');
    
    if (!adminUser) {
      return res.status(404).json({ error: "Admin user 'vinesh' not found" });
    }

    console.log(`Found admin user: ${adminUser.username}`);
    console.log(`Current password hash: ${adminUser.password.substring(0, 20)}...`);
    console.log(`Password is hashed: ${adminUser.password.startsWith('$2a$')}`);
    
    // Test current password
    try {
      const currentPasswordWorks = await adminUser.comparePassword('vinesh123');
      console.log(`Current password test: ${currentPasswordWorks ? 'WORKS' : 'FAILS'}`);
      
      if (currentPasswordWorks) {
        return res.json({
          message: "Admin password is already working correctly",
          username: adminUser.username,
          passwordWorks: true
        });
      }
    } catch (error) {
      console.log('Password comparison failed:', error.message);
    }

    // Force reset the password
    console.log('Resetting admin password...');
    
    // Manually hash the password to be sure
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('vinesh123', salt);
    
    await User.updateOne(
      { username: 'vinesh' },
      { 
        password: hashedPassword,
        loginAttempts: 0,
        lockUntil: undefined,
        updatedAt: new Date()
      }
    );

    console.log('✅ Admin password reset complete');
    
    // Test the new password
    const updatedUser = await User.findOne({ username: 'vinesh' }).select('+password');
    const newPasswordWorks = await updatedUser.comparePassword('vinesh123');
    
    res.json({
      message: "Admin password has been fixed",
      username: adminUser.username,
      passwordWorks: newPasswordWorks,
      details: {
        oldPasswordHash: adminUser.password.substring(0, 20) + '...',
        newPasswordHash: hashedPassword.substring(0, 20) + '...',
        passwordTest: newPasswordWorks ? 'PASS' : 'FAIL'
      }
    });
    
  } catch (error) {
    console.error('Error fixing admin password:', error);
    res.status(500).json({ error: "Failed to fix admin password: " + error.message });
  }
};

export const handleTestAdminLogin: RequestHandler = async (req, res) => {
  try {
    const adminUser = await User.findOne({ username: 'vinesh' }).select('+password +loginAttempts +lockUntil');
    
    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const passwordWorks = await adminUser.comparePassword('vinesh123');
    
    res.json({
      message: "Admin login test results",
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      passwordWorks,
      isLocked: adminUser.isLocked(),
      loginAttempts: adminUser.loginAttempts,
      passwordHash: adminUser.password.substring(0, 20) + '...',
      isActive: adminUser.isActive
    });
    
  } catch (error) {
    console.error('Error testing admin login:', error);
    res.status(500).json({ error: "Failed to test admin login: " + error.message });
  }
};
