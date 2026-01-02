// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { getUserPermissions } from '@/lib/permissions';
import { checkRateLimit, recordFailedAttempt, resetFailedAttempts, getClientIP } from '@/lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    // Check environment variables
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: JWT_SECRET is missing' },
        { status: 500 }
      );
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: MONGODB_URI is missing' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client IP address
    const clientIP = getClientIP(request);

    // Check rate limit before processing login
    const rateLimitCheck = await checkRateLimit(clientIP, email);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.message || 'Too many failed login attempts. Please try again later.',
          blockedUntil: rateLimitCheck.blockedUntil?.toISOString(),
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Connect to database with error handling
    try {
      await connectToDatabase();
      console.log('✅ Database connected');
    } catch (dbError: any) {
      console.error('❌ Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 500 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user using Mongoose
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Record failed attempt
      await recordFailedAttempt(clientIP, normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: rateLimitCheck.remainingAttempts ? rateLimitCheck.remainingAttempts - 1 : undefined,
        },
        { status: 401 }
      );
    }

    if (!user.password) {
      // Record failed attempt
      await recordFailedAttempt(clientIP, normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: rateLimitCheck.remainingAttempts ? rateLimitCheck.remainingAttempts - 1 : undefined,
        },
        { status: 401 }
      );
    }

    // Compare password using bcryptjs
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Record failed attempt
      await recordFailedAttempt(clientIP, normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: rateLimitCheck.remainingAttempts ? rateLimitCheck.remainingAttempts - 1 : undefined,
        },
        { status: 401 }
      );
    }

    // Login successful - reset failed attempts
    await resetFailedAttempts(clientIP);

    // Get user permissions for JWT token
    const permissions = await getUserPermissions(user._id.toString());

    // Create JWT token (valid for 7 days) with permissions
    const token = sign(
      { 
        userId: user._id.toString(), 
        email: user.email, 
        name: user.name,
        permissions // Include permissions in token
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userWithoutPassword = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });

    // Set token in HTTP-only cookie for middleware access
    // Production settings: secure=true, sameSite='lax' for cross-site compatibility
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // Allows cookie to be sent on top-level navigations
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      // Don't set domain - let browser handle it (works for all subdomains)
    });

    console.log('✅ Login successful, cookie set for:', normalizedEmail);
    console.log('🍪 Cookie value length:', token.length);

    return response;
  } catch (error: any) {
    console.error('❌ Login error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Return more specific error messages
    const errorMessage = error?.message || 'Something went wrong';
    return NextResponse.json(
      { 
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}