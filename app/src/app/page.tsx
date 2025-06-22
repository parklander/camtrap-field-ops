'use client';

import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SupabaseTest from '@/components/SupabaseTest';

function MainContent() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">CamTrap Field Ops</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <p className="text-gray-600 mb-6">
              You're successfully authenticated! This is your camera trap field operations dashboard.
            </p>
            
            {/* Supabase connection test */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">System Status</h3>
              <SupabaseTest />
            </div>

            {/* Placeholder for future features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Traps</h3>
                <p className="text-gray-600">Manage your deployed camera traps</p>
                <button className="mt-3 text-blue-600 hover:text-blue-800 font-medium">
                  View Traps →
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Deployments</h3>
                <p className="text-gray-600">Plan and track new deployments</p>
                <button className="mt-3 text-blue-600 hover:text-blue-800 font-medium">
                  New Deployment →
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Collection</h3>
                <p className="text-gray-600">Upload and sync field data</p>
                <button className="mt-3 text-blue-600 hover:text-blue-800 font-medium">
                  Upload Data →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <MainContent />
    </ProtectedRoute>
  );
}
