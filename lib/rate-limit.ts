import { connectToDatabase } from "@/lib/mongodb";
import LoginAttempt from "@/models/LoginAttempt";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MINUTES = 15; // Block for 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  blockedUntil?: Date;
  message?: string;
}

/**
 * Check if an IP address is allowed to attempt login
 */
export async function checkRateLimit(
  ipAddress: string,
  email?: string
): Promise<RateLimitResult> {
  await connectToDatabase();

  // Find existing attempt record
  const attempt = await LoginAttempt.findOne({ ipAddress });

  // If blocked, check if block period has expired
  if (attempt?.isBlocked && attempt.blockedUntil) {
    const now = new Date();
    if (now < attempt.blockedUntil) {
      const minutesRemaining = Math.ceil(
        (attempt.blockedUntil.getTime() - now.getTime()) / (1000 * 60)
      );
      return {
        allowed: false,
        blockedUntil: attempt.blockedUntil,
        message: `Too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
      };
    } else {
      // Block period expired, reset
      attempt.isBlocked = false;
      attempt.blockedUntil = null;
      attempt.attempts = 0;
      await attempt.save();
    }
  }

  // If no attempt record exists, allow
  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if attempts exceed limit
  if (attempt.attempts >= MAX_ATTEMPTS) {
    // Block the IP
    const blockedUntil = new Date();
    blockedUntil.setMinutes(blockedUntil.getMinutes() + BLOCK_DURATION_MINUTES);

    attempt.isBlocked = true;
    attempt.blockedUntil = blockedUntil;
    await attempt.save();

    return {
      allowed: false,
      blockedUntil,
      message: `Too many failed login attempts. Your IP has been blocked for ${BLOCK_DURATION_MINUTES} minutes.`,
    };
  }

  // Calculate remaining attempts
  const remainingAttempts = MAX_ATTEMPTS - attempt.attempts;

  return {
    allowed: true,
    remainingAttempts,
  };
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  ipAddress: string,
  email?: string
): Promise<void> {
  await connectToDatabase();

  const attempt = await LoginAttempt.findOne({ ipAddress });

  if (attempt) {
    attempt.attempts += 1;
    attempt.lastAttempt = new Date();
    if (email) {
      attempt.email = email;
    }

    // If attempts reach limit, block the IP
    if (attempt.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date();
      blockedUntil.setMinutes(blockedUntil.getMinutes() + BLOCK_DURATION_MINUTES);
      attempt.isBlocked = true;
      attempt.blockedUntil = blockedUntil;
    }

    await attempt.save();
  } else {
    // Create new attempt record
    await LoginAttempt.create({
      ipAddress,
      email,
      attempts: 1,
      lastAttempt: new Date(),
    });
  }
}

/**
 * Reset failed attempts on successful login
 */
export async function resetFailedAttempts(ipAddress: string): Promise<void> {
  await connectToDatabase();

  await LoginAttempt.findOneAndDelete({ ipAddress });
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback (in development, this might be localhost)
  return 'unknown';
}

