import { RequestHandler } from "express";
import { User } from "../models/User";

export const handleTestHybridAuth: RequestHandler = async (req, res) => {
  try {
    console.log('\n🔍 Testing Hybrid Authentication System');
    
    // Get all users with their passwords
    const users = await User.find({ isActive: true }).select('+password');
    
    const results = [];
    
    for (const user of users) {
      const result = {
        username: user.username,
        isPasswordHashed: user.isPasswordHashed(),
        passwordLength: user.password ? user.password.length : 0,
        passwordStart: user.password ? user.password.substring(0, 10) + '...' : 'N/A',
        canLoginWithOriginal: false
      };
      
      // Test original password mapping
      const originalPasswords: { [key: string]: string } = {
        'vinesh': 'vinesh123',
        'lebo': 'lebo123',
        'freedom': 'freedom123',
        'keenan': 'keenan123',
        'shehkira': 'shehkira123',
        'frans': 'frans123',
        'zaundre': 'zaundre123',
        'sune': 'sune123',
        'rona': 'Rontry999'
      };
      
      const originalPassword = originalPasswords[user.username];
      if (originalPassword) {
        try {
          result.canLoginWithOriginal = await user.comparePassword(originalPassword);
        } catch (error) {
          console.error(`Error testing password for ${user.username}:`, error);
        }
      }
      
      results.push(result);
      console.log(`${user.username}: Hashed=${result.isPasswordHashed}, CanLogin=${result.canLoginWithOriginal}`);
    }
    
    console.log('✅ Hybrid authentication test completed\n');
    
    res.json({
      message: "Hybrid authentication test completed",
      users: results,
      summary: {
        totalUsers: users.length,
        hashedPasswords: results.filter(r => r.isPasswordHashed).length,
        plainTextPasswords: results.filter(r => !r.isPasswordHashed).length,
        canLoginWithOriginal: results.filter(r => r.canLoginWithOriginal).length
      }
    });
    
  } catch (error) {
    console.error('Hybrid auth test error:', error);
    res.status(500).json({ error: "Test failed: " + error.message });
  }
};
