import React, { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { Building, Mail, Lock, User, CheckCircle, Loader2 } from "lucide-react"

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuth()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    tenantSlug: "demo-corp" // Default for demo purposes
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      // Handle password mismatch - you might want to add this to your auth context
      alert("Passwords do not match")
      return
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        tenantSlug: formData.tenantSlug
      })
    } catch (err) {
      // Error is handled by the auth context
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 text-base font-normal">Sign up for a new account to get started</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="h-5 w-5 text-gray-600" />
              <label htmlFor="tenantSlug" className="text-sm font-semibold text-gray-800">
                Organization
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <input
                disabled
                type="text"
                id="tenantSlug"
                name="tenantSlug"
                value={formData.tenantSlug}
                onChange={handleInputChange}
                required
                placeholder="Enter your organization slug"
                className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:bg-white hover:border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-5 w-5 text-gray-600" />
                <label htmlFor="firstName" className="text-sm font-semibold text-gray-800">
                  First Name
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="First name"
                  className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:bg-white hover:border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-5 w-5 text-gray-600" />
                <label htmlFor="lastName" className="text-sm font-semibold text-gray-800">
                  Last Name
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Last name"
                  className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:bg-white hover:border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-5 w-5 text-gray-600" />
              <label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email Address
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:bg-white hover:border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="h-5 w-5 text-gray-600" />
              <label htmlFor="password" className="text-sm font-semibold text-gray-800">
                Password
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Create a strong password"
                className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:bg-white hover:border-gray-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-gray-600" />
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-800">
                Confirm Password
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
                className="flex-1 px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 hover:bg-white hover:border-gray-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-blue-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] font-semibold shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 w-full bg-white border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-3 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 1C7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin} className="text-primary-600 hover:text-primary-500 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterForm
