'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function SignInForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, answer: 0 })
  const [mathAnswer, setMathAnswer] = useState('')
  const [mathError, setMathError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  // Generate a random math question
  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1 // 1-10
    const num2 = Math.floor(Math.random() * 10) + 1 // 1-10
    const answer = num1 + num2
    setMathQuestion({ num1, num2, answer })
    setMathAnswer('')
    setMathError('')
  }

  // Generate math question on component mount
  useEffect(() => {
    generateMathQuestion()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMathError('')

    // Validate math answer
    const userAnswer = parseInt(mathAnswer)
    if (isNaN(userAnswer) || userAnswer !== mathQuestion.answer) {
      setMathError('Incorrect answer. Please try again.')
      generateMathQuestion() // Generate a new question
      setLoading(false)
      return
    }

    const endpoint = isLogin ? '/api/login' : '/api/register'
    const body = isLogin 
      ? { email, password }
      : { name, email, password }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include', // Important: Include cookies in request/response
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle rate limiting (429 status)
        if (res.status === 429) {
          const errorMsg = data.error || 'Too many failed login attempts. Please try again later.';
          if (data.blockedUntil) {
            const blockedDate = new Date(data.blockedUntil);
            const minutesRemaining = Math.ceil((blockedDate.getTime() - Date.now()) / (1000 * 60));
            throw new Error(`${errorMsg} (Blocked for ${minutesRemaining} more minute(s))`);
          }
          throw new Error(errorMsg);
        }
        
        // Handle other errors
        let errorMessage = data.error || (isLogin ? 'Login failed' : 'Registration failed');
        
        // Add remaining attempts info if available
        if (data.remainingAttempts !== undefined) {
          errorMessage += ` (${data.remainingAttempts} attempt(s) remaining)`;
        }
        
        throw new Error(errorMessage);
      }

      // Store token in localStorage (for client-side use if needed)
      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      // Optional: store user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // The cookie is set by the server in the response headers
      // We need to wait for the browser to process it before redirecting
      // Using a small delay and then full page reload ensures cookie is sent
      setTimeout(() => {
        // Force a full page reload to ensure cookie is sent with request
        window.location.replace(callbackUrl)
      }, 100)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      generateMathQuestion() // Generate a new question on error
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    generateMathQuestion() // Generate a new question when toggling
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter a strong password"
              />
            </div>

            <div>
              <Label htmlFor="mathAnswer">
                Math Question: {mathQuestion.num1} + {mathQuestion.num2} = ?
              </Label>
              <Input
                id="mathAnswer"
                type="number"
                value={mathAnswer}
                onChange={(e) => {
                  setMathAnswer(e.target.value)
                  setMathError('')
                }}
                required
                placeholder="Enter the answer"
                className={mathError ? 'border-red-500' : ''}
              />
              {mathError && <p className="text-red-600 text-xs mt-1">{mathError}</p>}
            </div>

            {error && <p className="text-red-600 text-center text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          {/* <div className="mt-6 text-center text-sm">
            <button type="button" onClick={toggleMode} className="text-blue-600 hover:underline">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div> */}

        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}