'use client';

import { useEffect, useState } from 'react';
import { DataService } from '@/lib/data-service';
import type { Deployment, MaintenanceVisit } from '@/lib/db';
import Link from 'next/link';

export default function TimelinePage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [deps, vis] = await Promise.all([
        DataService.getDeployments(),
        DataService.getMaintenanceVisits ? DataService.getMaintenanceVisits() : Promise.resolve([])
      ]);
      setDeployments(deps);
      setVisits(vis);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Group deployments and visits by camera_id
  const cameras = Array.from(
    new Set(deployments.map(d => d.camera_id).filter(Boolean))
  ).sort((a, b) => (a && b ? a.localeCompare(b) : 0)) as string[];

  function getDeploymentsForCamera(camera_id: string) {
    return deployments.filter(d => d.camera_id === camera_id);
  }
  function getVisitsForCamera(camera_id: string) {
    // Find all deployments for this camera, then all visits for those deployments
    const depIds = deployments.filter(d => d.camera_id === camera_id).map(d => d.deployment_id);
    return visits.filter(v => depIds.includes(v.deployment_id));
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Camera Deployment Timeline</h1>
        <Link href="/" className="text-blue-600 hover:underline">&larr; Dashboard</Link>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading timeline...</div>
      ) : cameras.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No deployments found.</div>
      ) : (
        <div className="space-y-10">
          {cameras.map(camera_id => (
            <div key={camera_id} className="bg-white rounded shadow p-4 border">
              <h2 className="text-lg font-bold mb-2">Camera: <span className="font-mono">{camera_id}</span></h2>
              <div className="ml-4 border-l-2 border-blue-300 pl-4">
                {getDeploymentsForCamera(camera_id).map(dep => (
                  <div key={dep.deployment_id} className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      <span className="font-semibold">Deployment</span>
                      <span className="text-xs text-gray-500 ml-2">{new Date(dep.deployment_start).toLocaleDateString()} - {dep.deployment_end ? new Date(dep.deployment_end).toLocaleDateString() : 'Active'}</span>
                    </div>
                  </div>
                ))}
                {getVisitsForCamera(camera_id).map(visit => (
                  <div key={visit.visit_id} className="mb-2 ml-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <span className="font-semibold">Visit</span>
                      <span className="text-xs text-gray-500 ml-2">{new Date(visit.visit_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 