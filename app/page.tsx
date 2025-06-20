"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"
import { useAuth } from "@/lib/hooks/use-auth"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white min-h-screen lg:min-h-0 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Image
              src="/images/monetix-logo.png"
              alt="Monetix"
              width={200}
              height={60}
              className="mx-auto w-32 sm:w-40 md:w-48 lg:w-52 h-auto"
              priority
            />
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block lg:flex-1 relative min-h-screen">
        <Image src="/images/login-background.png" alt="Background" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-pink-400/20" />
      </div>
    </div>
  )
}
