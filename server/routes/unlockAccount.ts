import { RequestHandler } from "express";
import { User } from "../models/User";

export const handleUnlockAccount: RequestHandler = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('+loginAttempts +lockUntil');

    if (!user) {
      return res.status(404).json({ error: `User ${username} not found` });
    }

    const wasLocked = user.isLocked();
    
    // Reset login attempts and unlock account
    await User.updateOne(
      { username: username.toLowerCase() },
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`✅ Account unlocked for user: ${username}`);

    res.json({
      message: `Account unlocked for user: ${username}`,
      username,
      wasLocked,
      now: "Account is unlocked and ready for login"
    });

  } catch (error) {
    console.error('Error unlocking account:', error);
    res.status(500).json({ error: "Failed to unlock account: " + error.message });
  }
};

export const handleUnlockAllAccounts: RequestHandler = async (req, res) => {
  try {
    // Reset login attempts and unlock all accounts
    const result = await User.updateMany(
      { isActive: true },
      { 
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(`✅ All accounts unlocked. Updated ${result.modifiedCount} users`);

    res.json({
      message: "All user accounts have been unlocked",
      usersUpdated: result.modifiedCount,
      note: "All users can now attempt to login again"
    });

  } catch (error) {
    console.error('Error unlocking all accounts:', error);
    res.status(500).json({ error: "Failed to unlock accounts: " + error.message });
  }
};

export const handleCheckAccountStatus: RequestHandler = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('+loginAttempts +lockUntil');

    if (!user) {
      return res.status(404).json({ error: `User ${username} not found` });
    }

    const isLocked = user.isLocked();
    const lockTimeRemaining = user.lockUntil ? Math.max(0, user.lockUntil.getTime() - Date.now()) : 0;

    res.json({
      username: user.username,
      isLocked,
      loginAttempts: user.loginAttempts || 0,
      lockUntil: user.lockUntil || null,
      lockTimeRemainingMs: lockTimeRemaining,
      lockTimeRemainingMinutes: Math.ceil(lockTimeRemaining / (1000 * 60)),
      status: isLocked ? "LOCKED" : "UNLOCKED"
    });

  } catch (error) {
    console.error('Error checking account status:', error);
    res.status(500).json({ error: "Failed to check account status: " + error.message });
  }
};
