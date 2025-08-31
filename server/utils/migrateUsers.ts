import { User } from "../models/User";
import { users as existingUsers } from "../routes/auth";

export async function migrateUsersToMongoDB(): Promise<void> {
  try {
    console.log('Starting user migration to MongoDB...');
    console.log(`Total users to migrate: ${existingUsers.length}`);

    for (const userData of existingUsers) {
      try {
        // Check if user already exists in MongoDB
        const existingUser = await User.findOne({ 
          $or: [
            { id: userData.id },
            { username: userData.username },
            { email: userData.email }
          ]
        });

        if (existingUser) {
          console.log(`User ${userData.username} already exists in MongoDB, skipping...`);
          continue;
        }

        // Create new user in MongoDB
        const newUser = new User({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          password: userData.password, // Will be hashed by pre-save middleware
          role: userData.role,
          name: userData.name,
          location: userData.location,
          schedule: userData.schedule,
          isActive: true,
          createdAt: new Date(userData.createdAt),
          updatedAt: new Date()
        });

        await newUser.save();
        console.log(`✅ Migrated user: ${userData.username} (${userData.role})`);
      } catch (userError) {
        console.error(`❌ Failed to migrate user ${userData.username}:`, userError);
      }
    }

    console.log('✅ User migration completed successfully!');
  } catch (error) {
    console.error('❌ User migration failed:', error);
    throw error;
  }
}

export async function verifyMigration(): Promise<boolean> {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const expectedUsers = existingUsers.length;
    
    console.log(`Migration verification: ${totalUsers}/${expectedUsers} users migrated`);
    
    // Check each user type
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    const staffCount = await User.countDocuments({ role: 'staff', isActive: true });
    const supervisorCount = await User.countDocuments({ role: 'supervisor', isActive: true });
    
    console.log(`User distribution: ${adminCount} admins, ${staffCount} staff, ${supervisorCount} supervisors`);
    
    return totalUsers === expectedUsers;
  } catch (error) {
    console.error('Migration verification failed:', error);
    return false;
  }
}

// Function to create a default admin user if none exists
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const adminExists = await User.findOne({ role: 'admin', isActive: true });

    if (!adminExists) {
      console.log('No admin user found, creating default admin...');

      const defaultAdmin = new User({
        id: 'admin-default',
        username: 'admin',
        email: 'admin@blockbusters.com',
        password: 'admin123', // Should be changed immediately
        role: 'admin',
        name: 'Default Administrator',
        location: {
          city: 'Johannesburg',
          address: '5 Thora Cres, Wynberg, Sandton, 2090',
          coordinates: { lat: -26.1076, lng: 28.0567 }
        },
        isActive: true
      });

      await defaultAdmin.save();
      console.log('✅ Default admin user created with username: admin, password: admin123');
      console.log('⚠️  Please change the default password immediately!');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
  }
}

// Mark all existing non-admin users as god_staff (legacy Vinesh staff)
export async function markExistingUsersAsGodStaff(hostOrgId: string): Promise<void> {
  try {
    const result = await User.updateMany(
      {
        isActive: true,
        role: { $in: ['staff', 'supervisor', 'apollo'] },
        $or: [{ god_staff: { $exists: false } }, { god_staff: false }]
      },
      { $set: { god_staff: true, organizations: [hostOrgId] } }
    );
    console.log(`Marked ${result.modifiedCount || 0} existing users as god_staff and set host organization`);
  } catch (error) {
    console.error('Failed to mark existing users as god_staff:', error);
  }
}
