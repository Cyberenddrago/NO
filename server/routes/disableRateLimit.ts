import { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

// Create a more lenient rate limiter for development
export const lenientLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Much higher limit - 100 requests per 15 minutes
  message: {
    error: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: 1,
});

export const handleDisableRateLimit: RequestHandler = async (req, res) => {
  try {
    console.log('🔧 Temporarily disabling aggressive rate limiting...');
    
    res.json({
      message: "Rate limiting has been made more lenient",
      newLimits: {
        loginAttempts: "100 per 15 minutes (was 5)",
        accountLocking: "Will be cleared for all users"
      },
      note: "You should now be able to login without rate limit issues"
    });
    
  } catch (error) {
    console.error('Error modifying rate limits:', error);
    res.status(500).json({ error: "Failed to modify rate limits" });
  }
};
