'use client';

import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SupabaseStatusIndicator from '@/components/SupabaseTest';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function MainContent() {
  const { user, signOut } = useAuth();
  const [activeDeployments, setActiveDeployments] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch deployments and count active ones (no end date)
    async function fetchActiveDeployments() {
      try {
        const deployments = await (await import('@/lib/data-service')).DataService.getDeployments();
        const active = deployments.filter((d: unknown) => !(d as any).deployment_end).length;
        setActiveDeployments(active);
      } catch {
        setActiveDeployments(null);
      }
    }
    fetchActiveDeployments();
  }, []);

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
            <div className="flex items-center gap-4">
              <SupabaseStatusIndicator />
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <p className="text-gray-600 mb-6">
              You&apos;re successfully authenticated! This is your camera trap field operations dashboard.
            </p>
            
            {/* Dashboard main actions as a responsive flex row */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-10">
              <button
                onClick={() => router.push('/deployments')}
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg p-8 flex flex-col items-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ minHeight: 140 }}
              >
                <span className="text-3xl font-bold mb-2">Deployments</span>
                <span className="text-5xl font-mono font-extrabold mt-2">
                  {activeDeployments === null ? '—' : activeDeployments}
                </span>
                <span className="text-base mt-1">active cameras</span>
              </button>
              <button
                onClick={() => router.push('/inventory')}
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg p-8 flex flex-col items-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ minHeight: 140 }}
              >
                <span className="text-3xl font-bold mb-2">Inventory</span>
                <span className="text-lg mb-2">Track supporting equipment</span>
              </button>
              <button
                onClick={() => router.push('/timeline')}
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg p-8 flex flex-col items-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ minHeight: 140 }}
              >
                <span className="text-3xl font-bold mb-2">Timeline</span>
                <span className="text-lg mb-2">Deployments and events</span>
              </button>
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
