'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SupabaseTest() {
  const [status, setStatus] = useState<string>('Testing connection...')
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    try {
      setStatus('Testing connection...')
      setError(null)
      
      // Test the connection by getting the current user session
      const { error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }
      
      setStatus('Connection successful! ✅')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('Connection failed! ❌')
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
      <button 
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Connection
      </button>
      <p className="mt-2">{status}</p>
      {error && (
        <p className="mt-2 text-red-500">Error: {error}</p>
      )}
    </div>
  )
} 