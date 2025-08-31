import { User } from "../models/User";
import bcrypt from "bcryptjs";

export async function listAllUsers() {
  try {
    const users = await User.find({ isActive: true }).select('+password');
    console.log('\n=== CURRENT USERS IN DATABASE ===');
    
    for (const user of users) {
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.name}`);
      console.log(`Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`Password is hashed: ${user.password.startsWith('$2a$') ? 'YES' : 'NO'}`);
      console.log('---');
    }
    
    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
}

export async function resetUserPassword(username: string, newPassword: string) {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.log(`User ${username} not found`);
      return false;
    }

    user.password = newPassword; // Will be hashed by pre-save middleware
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    
    console.log(`✅ Password reset for user ${username}`);
    return true;
  } catch (error) {
    console.error(`Error resetting password for ${username}:`, error);
    return false;
  }
}

export async function testPasswordComparison(username: string, password: string) {
  try {
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user) {
      console.log(`User ${username} not found`);
      return false;
    }

    const isValid = await user.comparePassword(password);
    console.log(`Password test for ${username}: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error(`Error testing password for ${username}:`, error);
    return false;
  }
}

export async function fixAllPasswords() {
  console.log('🔧 Fixing all user passwords...');

  const usersToFix = [
    { username: 'vinesh', password: 'vinesh123' },
    { username: 'lebo', password: 'lebo123' },
    { username: 'freedom', password: 'freedom123' },
    { username: 'keenan', password: 'keenan123' },
    { username: 'shehkira', password: 'shehkira123' },
    { username: 'frans', password: 'frans123' },
    { username: 'zaundre', password: 'zaundre123' },
    { username: 'sune', password: 'sune123' },
    { username: 'rona', password: 'Rontry999' }
  ];

  for (const userInfo of usersToFix) {
    await resetUserPassword(userInfo.username, userInfo.password);
  }

  console.log('✅ All passwords have been reset');
}
