import { useState, useEffect, useRef } from 'react';
import { DataService } from '@/lib/data-service';
import type { Location, Deployment, Project } from '@/lib/db';
import mapboxgl from 'mapbox-gl';
import { toPoint as mgrsToPoint } from 'mgrs';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_CAMTRAP_TOKEN || '';

export default function DeploymentLocationSelector({ onDeploymentCreated }: { onDeploymentCreated?: () => void }) {
  const [activeTab, setActiveTab] = useState<'predefined' | 'new'>('predefined');
  const [locations, setLocations] = useState<Location[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  // Minimal deployment form state
  const [deploymentStart, setDeploymentStart] = useState(() => new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm
  const [cameraId, setCameraId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Location state
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocLat, setNewLocLat] = useState<number | null>(null);
  const [newLocLng, setNewLocLng] = useState<number | null>(null);
  const [newLocMgrs, setNewLocMgrs] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  useEffect(() => {
    DataService.getLocations?.().then((locs: Location[] = []) => setLocations(locs));
    DataService.getProjects?.().then((projs: Project[] = []) => setProjects(projs));
  }, []);

  useEffect(() => {
    if (selectedLocationId) setShowForm(true);
    else setShowForm(false);
  }, [selectedLocationId]);

  // Mapbox map setup for New Location tab
  useEffect(() => {
    if (activeTab !== 'new' || !mapContainer.current) return;
    if (mapRef.current) return; // Only initialize once
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'streets' ? 'mapbox://styles/mapbox/streets-v11' : 'mapbox://styles/mapbox/satellite-streets-v11',
      center: [newLocLng ?? -99.5, newLocLat ?? 49.73], // Default: USA center
      zoom: 9, // Set to requested zoom
    });
    mapRef.current.on('click', (e) => {
      setNewLocLat(e.lngLat.lat);
      setNewLocLng(e.lngLat.lng);
    });
    // Resize map after it becomes visible
    setTimeout(() => {
      mapRef.current?.resize();
    }, 200);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, mapStyle]);

  // Update marker position if lat/lng changes
  useEffect(() => {
    if (mapRef.current && newLocLat !== null && newLocLng !== null) {
      // Always remove previous marker before creating a new one
      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = new mapboxgl.Marker()
        .setLngLat([newLocLng, newLocLat])
        .addTo(mapRef.current);
      mapRef.current.setCenter([newLocLng, newLocLat]);
    }
  }, [newLocLat, newLocLng]);

  // Add an effect to update the style if the toggle changes after map is initialized
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(mapStyle === 'streets' ? 'mapbox://styles/mapbox/streets-v11' : 'mapbox://styles/mapbox/satellite-streets-v11');
    }
  }, [mapStyle]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLocLat(pos.coords.latitude);
        setNewLocLng(pos.coords.longitude);
      },
      (err) => alert('Failed to get location: ' + err.message)
    );
  };

  const getDefaultProjectId = () => (projects.length > 0 ? projects[0].project_id : '');
  const getDefaultProjectName = () => (projects.length > 0 ? projects[0].project_name : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const location = locations.find(l => l.location_id === selectedLocationId);
      if (!location) throw new Error('Location not found');
      const project_id = getDefaultProjectId();
      if (!project_id) throw new Error('No project available. Please sync projects first.');
      const deployment: Omit<Deployment, 'deployment_id' | 'created_at' | 'updated_at'> = {
        project_id,
        location_id: location.location_id,
        location_name: location.location_name,
        latitude: location.latitude,
        longitude: location.longitude,
        deployment_start: new Date(deploymentStart).toISOString(),
        camera_id: cameraId,
        deployment_comments: notes || undefined,
      };
      await DataService.createDeployment(deployment);
      setCameraId('');
      setNotes('');
      setShowForm(false);
      setSelectedLocationId('');
      if (onDeploymentCreated) onDeploymentCreated();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to save deployment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded bg-white shadow">
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 py-2 px-4 text-center font-semibold ${activeTab === 'predefined' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('predefined')}
        >
          Predefined Locations
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center font-semibold ${activeTab === 'new' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('new')}
        >
          New Location
        </button>
      </div>
      {activeTab === 'predefined' && (
        <div>
          <label className="block mb-2 font-medium">Select a location</label>
          <select
            className="w-full px-2 py-1 border rounded"
            value={selectedLocationId}
            onChange={e => setSelectedLocationId(e.target.value)}
          >
            <option value="">-- Choose a location --</option>
            {locations.map(loc => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.location_name} ({loc.latitude}, {loc.longitude})
              </option>
            ))}
          </select>
        </div>
      )}
      {activeTab === 'new' && (
        <div>
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="px-3 py-1 rounded border text-xs bg-gray-100 hover:bg-gray-200 mr-2"
              onClick={() => setMapStyle(mapStyle === 'streets' ? 'satellite' : 'streets')}
            >
              {mapStyle === 'streets' ? 'Satellite View' : 'OSM View'}
            </button>
          </div>
          <div className="mb-4">
            <div ref={mapContainer} style={{ width: '100%', height: 250, borderRadius: 8, overflow: 'hidden' }} />
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={handleUseMyLocation}
            >
              Use My Location
            </button>
          </div>
          <label className="block mb-2 font-medium">Location Name</label>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded mb-3"
            placeholder="Enter location name"
            value={newLocName}
            onChange={e => setNewLocName(e.target.value)}
          />
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            className="w-full px-2 py-1 border rounded mb-3"
            placeholder="Enter description (optional)"
            value={newLocDesc}
            onChange={e => setNewLocDesc(e.target.value)}
          />
          <label className="block mb-2 font-medium">MGRS Coordinates</label>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded mb-3"
            placeholder="Enter MGRS (optional, e.g. 33TWN0000000000)"
            value={newLocMgrs}
            onChange={e => setNewLocMgrs(e.target.value.toUpperCase())}
          />
          <div className="mb-2 text-sm text-gray-700">
            Latitude: <span className="font-mono">{newLocLat ?? '--'}</span>
            <br />
            Longitude: <span className="font-mono">{newLocLng ?? '--'}</span>
          </div>
          <button
            type="button"
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={async () => {
              let latitude = newLocLat;
              let longitude = newLocLng;
              if (newLocMgrs.trim()) {
                try {
                  const pt = mgrsToPoint(newLocMgrs.trim());
                  if (pt && pt.length === 2) {
                    longitude = pt[0];
                    latitude = pt[1];
                  }
                } catch (err) {
                  setError('Invalid MGRS coordinate');
                  return;
                }
              }
              if (!newLocName || latitude === null || longitude === null) {
                setError('Please provide a name and select a location on the map or enter valid MGRS.');
                return;
              }
              setError(null);
              const newLocation: Location = {
                location_id: crypto.randomUUID(),
                project_id: getDefaultProjectId(),
                location_name: newLocName,
                latitude,
                longitude,
                location_comments: newLocDesc || undefined,
              };
              await DataService.createLocation?.(newLocation);
              // Refresh locations and auto-select the new one
              const locs = await DataService.getLocations?.() ?? [];
              setLocations(locs);
              setSelectedLocationId(newLocation.location_id);
              // Clear new location form
              setNewLocName('');
              setNewLocDesc('');
              setNewLocLat(null);
              setNewLocLng(null);
              setNewLocMgrs('');
            }}
          >
            Create Location
          </button>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>
      )}
      {/* Minimal deployment form after selecting a location */}
      {showForm && (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {projects.length > 0 && (
            <div className="mb-2 text-sm text-gray-700">
              Project: <span className="font-semibold">{getDefaultProjectName()}</span>
            </div>
          )}
          <div>
            <label className="block mb-1 font-medium">Start Date/Time</label>
            <input
              type="datetime-local"
              className="w-full px-2 py-1 border rounded"
              value={deploymentStart}
              onChange={e => setDeploymentStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Camera ID</label>
            <input
              type="text"
              className="w-full px-2 py-1 border rounded"
              value={cameraId}
              onChange={e => setCameraId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Notes</label>
            <textarea
              className="w-full px-2 py-1 border rounded"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter any notes (optional)"
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={saving || projects.length === 0}
          >
            {saving ? 'Saving...' : 'Save Deployment'}
          </button>
        </form>
      )}
      {/* TODO: Add map component here for both tabs */}
    </div>
  );
} 