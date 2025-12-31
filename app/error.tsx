'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-muted-foreground mb-8">
        {process.env.NODE_ENV === 'development' 
          ? error.message || 'An unexpected error occurred'
          : 'An error occurred. Please try again or contact support if the problem persists.'}
      </p>
      {process.env.NODE_ENV === 'development' && error.digest && (
        <p className="text-xs text-muted-foreground mb-4">Error digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

