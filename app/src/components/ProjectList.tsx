'use client';

import { useEffect, useState } from 'react';
import { DataService } from '@/lib/data-service';
import type { Project } from '@/lib/db';
import { RefreshCcw } from 'lucide-react';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  // Listen for online/offline events
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

  // Load projects and active project on mount
  useEffect(() => {
    DataService.getProjects().then(setProjects);
    const storedId = localStorage.getItem('activeProjectId');
    if (storedId) setActiveProjectId(storedId);
  }, []);

  // Update active project when ID changes
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('activeProjectId', activeProjectId);
      const proj = projects.find(p => p.project_id === activeProjectId) || null;
      setActiveProject(proj);
    } else {
      setActiveProject(null);
    }
  }, [activeProjectId, projects]);

  const handleSync = async () => {
    setSyncing(true);
    await DataService.syncProjectsFromSupabase();
    setProjects(await DataService.getProjects());
    setSyncing(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Projects</h2>
      <button
        onClick={handleSync}
        disabled={!online || syncing}
        className={`mb-2 px-2 py-1 rounded flex items-center gap-2 ${online ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500'} ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Sync Projects from Supabase"
      >
        <RefreshCcw
          className={syncing ? 'animate-spin' : ''}
          size={18}
          aria-hidden="true"
        />
        {syncing ? 'Syncing...' : 'Sync Projects from Supabase'}
      </button>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <ul className="mb-4">
          {projects.map(project => (
            <li key={project.project_id} className="mb-1">
              <button
                className={`px-2 py-1 rounded ${activeProjectId === project.project_id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveProjectId(project.project_id)}
              >
                {project.project_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {activeProject && (
        <div className="mt-2 p-2 border rounded bg-gray-50">
          <h3 className="font-semibold">{activeProject.project_name}</h3>
          <p className="text-sm text-gray-600">{activeProject.description}</p>
          <ul className="mt-2 text-xs">
            {activeProject.organization && <li><b>Organization:</b> {activeProject.organization}</li>}
            {activeProject.study_area && <li><b>Study Area:</b> {activeProject.study_area}</li>}
            {activeProject.principal_investigator && <li><b>PI:</b> {activeProject.principal_investigator}</li>}
            {activeProject.contact_email && <li><b>Email:</b> {activeProject.contact_email}</li>}
            {activeProject.website && <li><b>Website:</b> <a href={activeProject.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{activeProject.website}</a></li>}
            {activeProject.funding_source && <li><b>Funding:</b> {activeProject.funding_source}</li>}
            {activeProject.license && <li><b>License:</b> {activeProject.license}</li>}
          </ul>
        </div>
      )}
    </div>
  );
} 