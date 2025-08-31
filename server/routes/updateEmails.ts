import { RequestHandler } from "express";
import { User } from "../models/User";

export const handleUpdateAllEmails: RequestHandler = async (req, res) => {
  try {
    const newEmail = "yashen@bbplumbing.co.za";
    
    console.log(`🔧 Updating all user emails to: ${newEmail}`);
    
    // Get all active users
    const users = await User.find({ isActive: true });
    console.log(`Found ${users.length} users to update`);
    
    const updateResults = [];
    
    for (const user of users) {
      const oldEmail = user.email;
      
      // Update the email
      user.email = newEmail;
      user.updatedAt = new Date();
      
      await user.save();
      
      updateResults.push({
        username: user.username,
        name: user.name,
        oldEmail: oldEmail,
        newEmail: newEmail,
        updated: true
      });
      
      console.log(`✅ Updated ${user.username}: ${oldEmail} → ${newEmail}`);
    }
    
    console.log(`✅ All ${users.length} user emails updated successfully!`);
    
    res.json({
      message: `Successfully updated all user emails to ${newEmail}`,
      totalUsersUpdated: users.length,
      newEmail: newEmail,
      users: updateResults
    });
    
  } catch (error) {
    console.error('Error updating user emails:', error);
    res.status(500).json({ error: "Failed to update emails: " + error.message });
  }
};

export const handleGetAllUserEmails: RequestHandler = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('username name email');
    
    const userEmails = users.map(user => ({
      username: user.username,
      name: user.name,
      email: user.email
    }));
    
    res.json({
      message: "Current user emails",
      totalUsers: users.length,
      users: userEmails
    });
    
  } catch (error) {
    console.error('Error getting user emails:', error);
    res.status(500).json({ error: "Failed to get emails: " + error.message });
  }
};
