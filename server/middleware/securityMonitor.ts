import { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

interface SecurityEvent {
  timestamp: Date;
  userId?: string;
  username?: string;
  ip: string;
  userAgent: string;
  action: string;
  resource: string;
  method: string;
  statusCode?: number;
  suspicious: boolean;
  reason?: string;
}

// In-memory store for recent security events (in production, use Redis or database)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000;

// Suspicious patterns
const SUSPICIOUS_PATTERNS = {
  rapidRequests: 20, // requests per minute
  failedAuthAttempts: 5,
  forbiddenAccess: 3,
  sensitiveEndpoints: ['/api/auth/users', '/api/admin/', '/api/debug/'],
};

// Log security event
export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  securityEvents.push(securityEvent);
  
  // Keep only recent events
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift();
  }

  // Log suspicious events
  if (event.suspicious) {
    console.warn(`🚨 SECURITY ALERT: ${event.action} - ${event.reason}`, {
      user: event.username,
      ip: event.ip,
      resource: event.resource,
      userAgent: event.userAgent
    });
  }

  // Log all admin/debug access
  if (event.resource.includes('/admin/') || event.resource.includes('/debug/')) {
    console.log(`🔒 ADMIN ACCESS: ${event.username} accessed ${event.resource} from ${event.ip}`);
  }
};

// Check for suspicious activity
const isSuspiciousActivity = (req: any, user?: any): { suspicious: boolean; reason?: string } => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  // Check recent events from this IP
  const recentEvents = securityEvents.filter(
    event => event.ip === ip && event.timestamp > oneMinuteAgo
  );

  // Too many requests from same IP
  if (recentEvents.length > SUSPICIOUS_PATTERNS.rapidRequests) {
    return { suspicious: true, reason: 'Rapid requests from same IP' };
  }

  // Too many failed auth attempts
  const failedAuthEvents = recentEvents.filter(
    event => event.action === 'failed_auth'
  );
  if (failedAuthEvents.length > SUSPICIOUS_PATTERNS.failedAuthAttempts) {
    return { suspicious: true, reason: 'Multiple failed authentication attempts' };
  }

  // Access to sensitive endpoints without proper role
  const url = req.originalUrl || req.url;
  const isSensitive = SUSPICIOUS_PATTERNS.sensitiveEndpoints.some(pattern => 
    url.includes(pattern)
  );
  
  if (isSensitive && (!user || (user.role !== 'admin' && !url.includes('/api/auth/users')))) {
    return { suspicious: true, reason: 'Unauthorized access to sensitive endpoint' };
  }

  // Unusual user agent patterns
  const userAgent = req.get('User-Agent') || '';
  if (!userAgent || userAgent.length < 10 || userAgent.includes('bot') || userAgent.includes('crawler')) {
    return { suspicious: true, reason: 'Suspicious user agent' };
  }

  return { suspicious: false };
};

// Security monitoring middleware
export const securityMonitor: RequestHandler = (req: any, res, next) => {
  const user = req.user;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const resource = req.originalUrl || req.url;
  const method = req.method;

  // Skip monitoring for static assets and dev HMR endpoints
  if (
    resource.includes('.') ||
    resource.includes('/_vite/') ||
    resource.includes('/node_modules/') ||
    resource.startsWith('/@vite/') ||
    resource.startsWith('/@react-refresh') ||
    resource.startsWith('/@fs/')
  ) {
    return next();
  }

  const suspiciousCheck = isSuspiciousActivity(req, user);

  // Log the request
  logSecurityEvent({
    userId: user?.id,
    username: user?.username,
    ip,
    userAgent,
    action: 'api_request',
    resource,
    method,
    suspicious: suspiciousCheck.suspicious,
    reason: suspiciousCheck.reason,
  });

  // Override res.json to capture response status
  const originalJson = res.json;
  res.json = function(data: any) {
    // Log response status
    logSecurityEvent({
      userId: user?.id,
      username: user?.username,
      ip,
      userAgent,
      action: res.statusCode >= 400 ? 'failed_request' : 'successful_request',
      resource,
      method,
      statusCode: res.statusCode,
      suspicious: res.statusCode === 403 || res.statusCode === 401,
      reason: res.statusCode === 403 ? 'Access forbidden' : res.statusCode === 401 ? 'Unauthorized' : undefined,
    });

    return originalJson.call(this, data);
  };

  next();
};

// Rate limiting for sensitive endpoints
export const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit to 50 requests per windowMs for sensitive endpoints
  message: {
    error: "Too many requests to sensitive endpoint, please try again later."
  },
  skip: (req: any) => {
    // Skip rate limiting for admins from trusted IPs (optional)
    const user = req.user;
    return user?.role === 'admin' && req.ip === '127.0.0.1';
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get security events (admin only)
export const getSecurityEvents = (req: any, res: any) => {
  const user = req.user;
  
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Return recent events (last 100)
  const recentEvents = securityEvents
    .slice(-100)
    .reverse()
    .map(event => ({
      ...event,
      // Mask sensitive data
      userAgent: event.userAgent.substring(0, 50) + '...',
    }));

  res.json({
    events: recentEvents,
    summary: {
      totalEvents: securityEvents.length,
      suspiciousEvents: securityEvents.filter(e => e.suspicious).length,
      lastHourEvents: securityEvents.filter(e => 
        new Date().getTime() - e.timestamp.getTime() < 3600000
      ).length,
    }
  });
};

export default securityMonitor;
