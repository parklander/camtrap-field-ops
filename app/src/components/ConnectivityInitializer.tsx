'use client';

import { useEffect } from 'react';
import { ConnectivityService } from '@/lib/connectivity-service';

export function ConnectivityInitializer() {
  useEffect(() => {
    // Initialize the connectivity service
    ConnectivityService.initialize();
    
    console.log('Connectivity service initialized');
  }, []);

  // This component doesn't render anything
  return null;
} 