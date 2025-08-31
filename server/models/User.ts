import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";

export interface IUser extends mongoose.Document {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "supervisor" | "apollo" | "super_admin";
  name: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bio?: string;
  location?: {
    city: "Johannesburg" | "Cape Town";
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  god_staff?: boolean;
  schedule?: {
    workingLateShift?: boolean;
    shiftStartTime?: string;
    shiftEndTime?: string;
    weekType?: "normal" | "late";
  };
  salary?: {
    type: "monthly" | "per_job" | "both";
    monthlyAmount?: number;
    perJobRates?: { [category: string]: number };
    currency?: string;
    effectiveDate?: string;
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordHashed(): boolean;
  generatePasswordResetToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new mongoose.Schema<IUser>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_-]+$/.test(v);
      },
      message: 'Username can only contain letters, numbers, underscores, and hyphens'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ["admin", "staff", "supervisor", "apollo", "super_admin"],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  god_staff: {
    type: Boolean,
    default: false
  },
  companyId: {
    type: String,
    trim: true
  },
  organizations: {
    type: [String],
    default: []
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || validator.isMobilePhone(v, 'any');
      },
      message: 'Please provide a valid phone number'
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  emergencyContact: {
    type: String,
    trim: true,
    maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
  },
  emergencyPhone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || validator.isMobilePhone(v, 'any');
      },
      message: 'Please provide a valid emergency contact phone number'
    }
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  location: {
    city: {
      type: String,
      enum: ["Johannesburg", "Cape Town"]
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  schedule: {
    workingLateShift: { type: Boolean, default: false },
    shiftStartTime: {
      type: String,
      default: "05:00",
      validate: {
        validator: function(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    shiftEndTime: {
      type: String,
      default: "17:00",
      validate: {
        validator: function(v: string) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    weekType: {
      type: String,
      enum: ["normal", "late"],
      default: "normal"
    }
  },
  salary: {
    type: {
      type: String,
      enum: ["monthly", "per_job", "both"]
    },
    monthlyAmount: {
      type: Number,
      min: [0, 'Monthly amount must be positive']
    },
    perJobRates: {
      type: mongoose.Schema.Types.Mixed
    },
    currency: {
      type: String,
      default: "ZAR",
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    },
    effectiveDate: String
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Indexes for performance and security
// username and email already have unique indexes via schema definitions
userSchema.index({ role: 1 });
userSchema.index({ 'location.city': 1 });

// Virtual for account lock status
userSchema.virtual('accountLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to check if password is hashed
userSchema.methods.isPasswordHashed = function(): boolean {
  return this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'));
};

// Method to compare password - handles both hashed and plain text passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // Check if password exists
    if (!this.password) {
      return false;
    }

    // Check if password is hashed
    if (this.isPasswordHashed()) {
      // Use bcrypt comparison for hashed passwords
      return await bcrypt.compare(candidatePassword, this.password);
    } else {
      // For plain text passwords (old users), do direct comparison
      return this.password === candidatePassword;
    }
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return resetToken;
};

// Method to check if account is locked
userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function(): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Static method to sanitize user input
userSchema.statics.sanitizeInput = function(input: any) {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
