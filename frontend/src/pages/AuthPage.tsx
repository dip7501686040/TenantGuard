import React, { useState } from "react"
import LoginForm from "../components/auth/LoginForm"
import RegisterForm from "../components/auth/RegisterForm"

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-900">TenantGuard</h1>
          <p className="text-primary-600 mt-2">Secure Multi-Tenant Identity Management</p>
        </div>

        {isLogin ? <LoginForm onSwitchToRegister={() => setIsLogin(false)} /> : <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />}
      </div>
    </div>
  )
}

export default AuthPage
