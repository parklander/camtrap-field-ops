'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SupabaseStatusIndicator() {
  const [status, setStatus] = useState<'ok' | 'pending' | 'error'>('pending')
  const [message, setMessage] = useState<string>('Checking Supabase connection...')

  const checkConnection = async () => {
    setStatus('pending')
    setMessage('Checking Supabase connection...')
    try {
      const { error } = await supabase.from('projects').select('*').limit(1)
      if (error) {
        setStatus('error')
        setMessage('Supabase connection failed!')
      } else {
        setStatus('ok')
        setMessage('Supabase connection is healthy.')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Supabase connection failed!')
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // every 30 seconds
    return () => clearInterval(interval)
  }, [])

  let color = 'bg-yellow-400'
  if (status === 'ok') color = 'bg-green-500'
  if (status === 'error') color = 'bg-red-500'

  return (
    <div className="flex items-center" title={message} aria-label={message}>
      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${color} border border-gray-300`} />
      <span className="text-xs text-gray-600 hidden sm:inline">Supabase</span>
    </div>
  )
} 