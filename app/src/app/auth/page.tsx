'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CamTrap Field Ops</h1>
          <p className="text-gray-600">Sign in to access your camera trap data</p>
        </div>

        {/* Toggle between login and signup */}
        <div className="flex bg-white rounded-lg shadow-sm mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-l-lg transition-colors ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-r-lg transition-colors ${
              !isLogin
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth forms */}
        {isLogin ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  );
} 