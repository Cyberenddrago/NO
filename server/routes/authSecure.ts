import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import validator from "validator";
import { User, IUser } from "../models/User";
import { LoginRequest, LoginResponse } from "@shared/types";
import crypto from "crypto";

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Rate limiting for login attempts (lenient for development)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Much higher limit for development - 100 requests per windowMs
  message: {
    error: "Too many login attempts from this IP, please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1, // Trust only the first proxy (safer than true)
});

// Rate limiting for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: "Too many password reset attempts from this IP, please try again in 1 hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1, // Trust only the first proxy (safer than true)
});

// Input sanitization middleware
export const sanitizeInput = (req: any, res: any, next: any) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    // Remove potential NoSQL injection operators and XSS
    return validator.escape(obj.replace(/[${}]/g, '').trim());
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !key.startsWith('$')) { // Block NoSQL operators
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token middleware
export const verifyToken: RequestHandler = async (req: any, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('🚫 No token provided in request to:', req.url);
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findOne({ id: decoded.userId, isActive: true });

    if (!user) {
      console.log('🚫 Invalid token - user not found:', decoded.userId);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`✅ Token verified for user: ${user.username} (${user.role}) accessing ${req.url}`);
    req.user = user;
    next();
  } catch (error) {
    console.log('🚫 Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Login handler
export const handleSecureLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    if (!validator.isLength(username, { min: 1, max: 50 })) {
      return res.status(400).json({ error: "Invalid username format" });
    }

    if (!validator.isLength(password, { min: 1, max: 128 })) {
      return res.status(400).json({ error: "Invalid password format" });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ],
      isActive: true
    }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is locked (except for emergency admin)
    if (user.isLocked() && user.username !== 'rona') {
      return res.status(423).json({
        error: "Account temporarily locked due to too many failed login attempts. Please try again later."
      });
    }

    // Hybrid password verification for old and new users
    const isPasswordValid = await user.comparePassword(password);

    // If valid and password is not hashed yet, migrate to hashed password
    if (isPasswordValid && !user.isPasswordHashed()) {
      console.log(`Migrating user ${user.username} to hashed password`);
      user.password = password; // This will be hashed by the pre-save middleware
      await user.save();
      console.log(`✅ User ${user.username} password migrated to hash`);
    }

    if (!isPasswordValid) {
      // Increment login attempts (except for emergency admin)
      if (user.username !== 'rona') {
        await user.incLoginAttempts();
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove sensitive data from response
    const userResponse = user.toJSON();

    const response: LoginResponse = {
      user: userResponse,
      token
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Token verification handler
export const handleVerifyToken: RequestHandler = async (req: any, res) => {
  try {
    const user = req.user;
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create user (admin or super_admin)
export const handleCreateUser: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: "Only administrators can create users" });
    }

    const { name, username, email, password, role, companyId, organizations } = req.body || {};

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Name, username, email and password are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const normalizedUsername = String(username).toLowerCase();
    const normalizedEmail = String(email).toLowerCase();

    // Prevent creating privileged accounts
    if (role === 'admin' || role === 'super_admin') {
      return res.status(403).json({ error: "Cannot create admin or super admin accounts via this endpoint" });
    }

    const existingUser = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    const newUser = new User({
      id: `${(role || 'staff')}-${Date.now()}`,
      username: normalizedUsername,
      email: normalizedEmail,
      password: String(password),
      role: role && ['staff', 'supervisor', 'apollo'].includes(role) ? role : 'staff',
      name: String(name),
      companyId: companyId ? String(companyId) : undefined,
      organizations: Array.isArray(organizations) ? organizations.map((id: any) => String(id)) : [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newUser.save();
    res.status(201).json(newUser.toJSON());
  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get users (admin and apollo access)
export const handleGetUsers: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;

    // Allow admin, super_admin, apollo, and supervisor users to view users
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && currentUser.role !== 'apollo' && currentUser.role !== 'supervisor') {
      return res.status(403).json({ error: "Access denied" });
    }

    let users;
    if (currentUser.role === 'super_admin') {
      // Super admin can see all users
      users = await User.find({ isActive: true });
    } else if (currentUser.role === 'admin') {
      // Tenant admin: only users in same organizations (and self), exclude other admins
      const uOrgs: string[] = Array.isArray(currentUser.organizations) ? currentUser.organizations : [];
      if (uOrgs.length === 0) {
        users = await User.find({ isActive: true, id: currentUser.id, role: { $ne: 'admin' } });
      } else {
        users = await User.find({
          isActive: true,
          role: { $ne: 'admin' },
          $or: [
            { id: currentUser.id },
            { organizations: { $in: uOrgs } }
          ]
        });
      }
    } else if (currentUser.role === 'apollo') {
      // Apollo users: staff in same organizations
      const uOrgs: string[] = Array.isArray(currentUser.organizations) ? currentUser.organizations : [];
      users = await User.find({
        isActive: true,
        role: 'staff',
        ...(uOrgs.length ? { organizations: { $in: uOrgs } } : { id: currentUser.id })
      });
    } else if (currentUser.role === 'supervisor') {
      // Supervisors can see staff members and other supervisors in same orgs
      const uOrgs: string[] = Array.isArray(currentUser.organizations) ? currentUser.organizations : [];
      users = await User.find({
        isActive: true,
        role: { $in: ['staff', 'supervisor'] },
        ...(uOrgs.length ? { organizations: { $in: uOrgs } } : { id: currentUser.id })
      });
    }

    console.log(`✅ User ${currentUser.username} (${currentUser.role}) fetched ${users?.length || 0} users`);
    res.json(users || []);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user (admin only)
export const handleUpdateUser: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const updates = req.body;

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Only administrators can update users" });
    }

    // Prevent assigning god_staff to non-host organizations
    if (updates && Array.isArray(updates.organizations)) {
      const target = await User.findOne({ id });
      if (target?.god_staff) {
        const { getOrganizationByName, HOST_ORG_NAME } = await import("../routes/organizations");
        const host = getOrganizationByName(HOST_ORG_NAME);
        const hostId = host?.id;
        const invalid = updates.organizations.some((orgId: string) => orgId !== hostId);
        if (hostId && invalid) {
          return res.status(403).json({ error: "God staff cannot be assigned to client companies" });
        }
      }
    }

    // Prevent updating sensitive fields directly
    delete updates.password;
    delete updates.passwordResetToken;
    delete updates.passwordResetExpires;
    delete updates.loginAttempts;
    delete updates.lockUntil;

    const user = await User.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.toJSON());
  } catch (error) {
    console.error('Update user error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user password (admin only)
export const handleUpdateUserPassword: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { password } = req.body;

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Only administrators can update passwords" });
    }

    if (!password || !validator.isLength(password, { min: 6, max: 128 })) {
      return res.status(400).json({ 
        error: "Password must be between 6 and 128 characters long" 
      });
    }

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = password;
    user.updatedAt = new Date();
    
    // Reset login attempts and unlock account if locked
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Request password reset
export const handlePasswordResetRequest: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please provide a username or email address" });
    }

    // If it's not a valid email, treat it as a username
    const isEmail = validator.isEmail(email);

    if (!isEmail && email.length < 3) {
      return res.status(400).json({ error: "Please provide a valid username or email address" });
    }

    // Find any user with this email or username
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ],
      isActive: true
    });

    if (!user) {
      // Still send success message for security
      return res.json({
        message: "If a user account with that email exists, a password reset link has been sent to yashen@bbplumbing.co.za"
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email to the user's actual email address
    const resetEmail = user.email;

    try {
      // Import email service and send reset email
      const { sendPasswordResetEmail } = await import("../utils/emailService");
      await sendPasswordResetEmail(resetEmail, user.name, user.username, resetToken);
      console.log(`Password reset email sent to ${resetEmail} for user ${user.username}`);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // For now, log the token if email fails
      console.log(`Password reset token for ${user.username}: ${resetToken}`);
    }

    res.json({
      message: `If a user account with that email exists, a password reset link has been sent to ${resetEmail}`,
      // Remove this in production - only for testing
      resetToken
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset password with token
export const handlePasswordReset: RequestHandler = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (!validator.isLength(password, { min: 6, max: 128 })) {
      return res.status(400).json({ 
        error: "Password must be between 6 and 128 characters long" 
      });
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.updatedAt = new Date();

    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete user (admin only)
export const handleDeleteUser: RequestHandler = async (req: any, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: "Only administrators can delete users" });
    }

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: "Cannot delete administrator accounts" });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Logout handler (client-side token removal)
export const handleLogout: RequestHandler = (req, res) => {
  // In a more sophisticated setup, you might maintain a blacklist of tokens
  // For now, we rely on client-side token removal
  res.json({ message: "Logged out successfully" });
};
