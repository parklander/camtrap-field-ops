"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataService } from "@/lib/data-service";
import type { Deployment } from "@/lib/db";
import type { MaintenanceVisit } from "@/lib/db";
import mapboxgl from 'mapbox-gl';
import { NotebookPen } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_CAMTRAP_TOKEN || '';

export default function DeploymentDetailPage({ params }: { params: { deployment_id: string } }) {
  const router = useRouter();
  const deployment_id = params?.deployment_id;
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitType, setVisitType] = useState<'deployment' | 'maintenance' | 'retrieval' | 'emergency'>('maintenance');
  const [technicianName, setTechnicianName] = useState('');
  const [cameraFunctioning, setCameraFunctioning] = useState(true);
  const [visitNotes, setVisitNotes] = useState("");
  const [visitSuccess, setVisitSuccess] = useState<string | null>(null);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [visits, setVisits] = useState<MaintenanceVisit[]>([]);
  const [batteryChanged, setBatteryChanged] = useState(false);
  const [sdCardChanged, setSdCardChanged] = useState(false);
  const [cameraRepositioned, setCameraRepositioned] = useState(false);
  const [cameraCleaned, setCameraCleaned] = useState(false);
  const [cameraRepaired, setCameraRepaired] = useState(false);

  useEffect(() => {
    if (!deployment_id) {
      setDeployment(null);
      setLoading(false);
      return;
    }
    async function fetchDeployment() {
      setLoading(true);
      setError(null);
      try {
        if (typeof deployment_id === 'string') {
          const dep = await DataService.getDeployment?.(deployment_id);
          setDeployment(dep || null);
        } else {
          setDeployment(null);
        }
      } catch {
        setError("Failed to load deployment");
      } finally {
        setLoading(false);
      }
    }
    fetchDeployment();
    // Fetch maintenance visits for this deployment
    async function fetchVisits() {
      const allVisits = await DataService.getMaintenanceVisits();
      setVisits(
        allVisits
          .filter(v => v.deployment_id === deployment_id)
          .sort((a, b) => (b.visit_date.localeCompare(a.visit_date)))
      );
    }
    fetchVisits();
  }, [deployment_id, visitSuccess]);

  useEffect(() => {
    if (!deployment || !deployment.latitude || !deployment.longitude) return;
    if (!mapContainer.current) return;
    if (mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      center: [deployment.longitude, deployment.latitude],
      zoom: 13,
    });
    // Add camera marker
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.background = 'none';
    el.style.border = 'none';
    el.innerHTML = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/></svg>`;
    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([deployment.longitude, deployment.latitude])
      .addTo(mapRef.current);
    setTimeout(() => {
      mapRef.current?.resize();
    }, 200);
    return () => {
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [deployment]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!deployment) return <div className="p-8 text-center">Deployment not found.</div>;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <button className="mb-6 text-blue-600 hover:underline" onClick={() => router.push('/deployments')}>&larr; Back to Deployments</button>
      <div className="bg-white rounded shadow p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Deployment Details</h1>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-2"
            onClick={() => setShowVisitForm(true)}
          >
            <NotebookPen size={20} />
            Log Maintenance Visit
          </button>
        </div>
        <div className="mb-2"><span className="font-semibold">Location:</span> {deployment.location_name || deployment.location_id}</div>
        <div className="mb-2"><span className="font-semibold">Camera ID:</span> {deployment.camera_id || "-"}</div>
        <div className="mb-2"><span className="font-semibold">Start:</span> {deployment.deployment_start}</div>
        <div className="mb-2"><span className="font-semibold">End:</span> {deployment.deployment_end || <span className="text-gray-400">(Active)</span>}</div>
        <div className="mb-2"><span className="font-semibold">Notes:</span> {deployment.deployment_comments || <span className="text-gray-400">None</span>}</div>
        <div className="mb-2"><span className="font-semibold">Latitude:</span> {deployment.latitude}</div>
        <div className="mb-2"><span className="font-semibold">Longitude:</span> {deployment.longitude}</div>
        <div className="mb-2"><span className="font-semibold">Status:</span> {deployment.deployment_end ? <span className="text-red-600 font-semibold">Inactive</span> : <span className="text-green-600 font-semibold">Active</span>}</div>
        <div className="mb-2"><span className="font-semibold">Deployment ID:</span> {deployment.deployment_id}</div>
        {deployment.latitude && deployment.longitude && (
          <div className="my-6">
            <div className="mb-2 font-semibold text-gray-700">Deployment Location</div>
            <div ref={mapContainer} style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden' }} />
          </div>
        )}
        <div className="mt-8">
          {showVisitForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-40"
                onClick={() => setShowVisitForm(false)}
              />
              {/* Modal */}
              <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
                <h2 className="text-xl font-bold mb-4">Log Maintenance Visit</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setVisitSuccess(null);
                    setVisitError(null);
                    try {
                      await DataService.createMaintenanceVisit({
                        deployment_id: deployment.deployment_id,
                        project_id: deployment.project_id,
                        visit_date: visitDate,
                        visit_type: visitType,
                        technician_name: technicianName,
                        camera_functioning: cameraFunctioning,
                        visit_notes: visitNotes,
                        battery_changed: batteryChanged,
                        sd_card_changed: sdCardChanged,
                        camera_repositioned: cameraRepositioned,
                        camera_cleaned: cameraCleaned,
                        camera_repaired: cameraRepaired,
                      });
                      setVisitSuccess('Maintenance visit logged!');
                      setShowVisitForm(false);
                      setVisitNotes("");
                      setTechnicianName("");
                      setVisitType('maintenance');
                      setCameraFunctioning(true);
                      setBatteryChanged(false);
                      setSdCardChanged(false);
                      setCameraRepositioned(false);
                      setCameraCleaned(false);
                      setCameraRepaired(false);
                    } catch {
                      setVisitError('Failed to log maintenance visit.');
                    }
                  }}
                >
                  <label className="block mb-2 font-semibold">Visit Date</label>
                  <input
                    type="date"
                    className="mb-4 p-2 border rounded w-full"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    required
                  />
                  <label className="block mb-2 font-semibold">Visit Type</label>
                  <select
                    className="mb-4 p-2 border rounded w-full"
                    value={visitType}
                    onChange={e => setVisitType(e.target.value as 'deployment' | 'maintenance' | 'retrieval' | 'emergency')}
                    required
                  >
                    <option value="deployment">Deployment</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retrieval">Retrieval</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  <label className="block mb-2 font-semibold">Technician Name</label>
                  <input
                    type="text"
                    className="mb-4 p-2 border rounded w-full"
                    value={technicianName}
                    onChange={e => setTechnicianName(e.target.value)}
                    required
                    placeholder="Enter technician name"
                  />
                  <label className="block mb-2 font-semibold">Camera Functioning?</label>
                  <select
                    className="mb-4 p-2 border rounded w-full"
                    value={cameraFunctioning ? 'yes' : 'no'}
                    onChange={e => setCameraFunctioning(e.target.value === 'yes')}
                    required
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                  <div className="mb-4">
                    <label className="block font-semibold mb-2">Maintenance Actions</label>
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-2" checked={batteryChanged} onChange={e => setBatteryChanged(e.target.checked)} />
                        Battery Changed
                      </label>
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-2" checked={sdCardChanged} onChange={e => setSdCardChanged(e.target.checked)} />
                        SD Card Changed
                      </label>
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-2" checked={cameraRepositioned} onChange={e => setCameraRepositioned(e.target.checked)} />
                        Camera Repositioned
                      </label>
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-2" checked={cameraCleaned} onChange={e => setCameraCleaned(e.target.checked)} />
                        Camera Cleaned
                      </label>
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="mr-2" checked={cameraRepaired} onChange={e => setCameraRepaired(e.target.checked)} />
                        Camera Repaired
                      </label>
                    </div>
                  </div>
                  <label className="block mb-2 font-semibold">Notes</label>
                  <textarea
                    className="mb-4 p-2 border rounded w-full"
                    value={visitNotes}
                    onChange={e => setVisitNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes about this visit"
                    required
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      onClick={() => setShowVisitForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Visit
                    </button>
                  </div>
                </form>
                {visitError && <div className="mt-2 text-red-600">{visitError}</div>}
              </div>
            </div>
          )}
          {visitSuccess && <div className="mt-2 text-green-600">{visitSuccess}</div>}
        </div>
      </div>
      {/* Maintenance Visits List */}
      <div className="bg-white rounded shadow p-6 border mt-8">
        <h2 className="text-xl font-bold mb-4">Maintenance Visits</h2>
        {visits.length === 0 ? (
          <div className="text-gray-500">No maintenance visits logged for this deployment.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {visits.map((visit) => (
              <li key={visit.visit_id}>
                <Link
                  href={`/deployments/${deployment_id}/visits/${visit.visit_id}`}
                  className="flex justify-between items-center py-2 hover:bg-gray-50 rounded transition-colors"
                >
                  <span className="font-mono">{visit.visit_date.slice(0, 10)}</span>
                  <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800 font-semibold">{visit.visit_type}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 