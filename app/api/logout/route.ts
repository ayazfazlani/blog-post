import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ 
    message: 'Logout successful' 
  });

  // Clear the auth token cookie
  response.cookies.delete('auth-token');
  
  // Also set it to expire immediately (extra safety)
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

