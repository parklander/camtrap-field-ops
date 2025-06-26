'use client';

import { useEffect, useState } from 'react';
import { DataService } from '@/lib/data-service';
import type { Project } from '@/lib/db';
import { RefreshCcw } from 'lucide-react';

export default function ProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    DataService.getProjects().then(setProjects);
    const storedId = localStorage.getItem('activeProjectId');
    if (storedId) setActiveProjectId(storedId);
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('activeProjectId', activeProjectId);
    }
  }, [activeProjectId]);

  const handleSync = async () => {
    setSyncing(true);
    await DataService.syncProjectsFromSupabase();
    setProjects(await DataService.getProjects());
    setSyncing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeProjectId || ''}
        onChange={e => setActiveProjectId(e.target.value)}
        className="px-2 py-1 rounded border border-gray-300 bg-white text-sm"
        aria-label="Select active project"
      >
        <option value="" disabled>Select project...</option>
        {projects.map(project => (
          <option key={project.project_id} value={project.project_id}>
            {project.project_name}
          </option>
        ))}
      </select>
      <button
        onClick={handleSync}
        disabled={!online || syncing}
        className={`p-1 rounded ${online ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500'} ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Sync Projects from Supabase"
        title="Sync Projects from Supabase"
      >
        <RefreshCcw
          className={syncing ? 'animate-spin' : ''}
          size={18}
          aria-hidden="true"
        />
      </button>
    </div>
  );
} 