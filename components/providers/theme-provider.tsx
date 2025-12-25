"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

import type { ReactNode } from "react"

interface ThemeProviderProps {
  children: ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ children, attribute, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute as any}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

