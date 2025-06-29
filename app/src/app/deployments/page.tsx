"use client";

import { useState, useEffect, useRef } from "react";
import DeploymentLocationSelector from "@/components/DeploymentLocationSelector";
import { DataService } from "@/lib/data-service";
import type { Deployment, Location } from "@/lib/db";
import mapboxgl from 'mapbox-gl';
import { MapPinPlus, Download } from 'lucide-react';
import Supercluster, { PointFeature, AnyProps } from 'supercluster';
import Link from 'next/link';
import { forward as mgrsForward } from 'mgrs';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_CAMTRAP_TOKEN || '';

export default function DeploymentsPage() {
  const [showSelector, setShowSelector] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const clusterRef = useRef<Supercluster | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | null>(null);

  const fetchDeploymentsAndLocations = async () => {
    setDeployments(await DataService.getDeployments());
    setLocations(await DataService.getLocations?.() ?? []);
  };

  useEffect(() => {
    fetchDeploymentsAndLocations();
  }, []);

  // Helper to get location name by id or name
  const getLocationName = (nameOrId: string) =>
    locations.find((loc) => loc.location_id === nameOrId)?.location_name || nameOrId;

  // Helper to format date as YYYY-MM-DD
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().slice(0, 10);
  };

  // Create cluster marker element
  const createClusterMarker = (count: number) => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.background = '#2563eb';
    el.style.border = '2px solid white';
    el.style.borderRadius = '50%';
    el.style.color = 'white';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '14px';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.textContent = count.toString();
    return el;
  };

  // Create individual deployment marker element (white camera on blue, with border and shadow)
  const createDeploymentMarker = () => {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.width = '36px';
    el.style.height = '36px';
    el.style.background = '#2563eb';
    el.style.border = '2px solid white';
    el.style.borderRadius = '50%';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`;
    return el;
  };

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'deploymentID',
      'projectID',
      'locationID',
      'locationName',
      'latitude',
      'longitude',
      'deploymentStart',
      'deploymentEnd',
      'cameraID',
      'cameraModel',
      'cameraHeight',
      'cameraDepth',
      'cameraTilt',
      'cameraHeading',
      'detectionDistance',
      'baitUse',
      'timestampIssues',
      'deploymentComments'
    ];
    const csvContent = [
      headers.join(','),
      ...deployments.map(dep => [
        dep.deployment_id,
        dep.project_id || '',
        dep.location_id || '',
        dep.location_name || '',
        dep.latitude || '',
        dep.longitude || '',
        dep.deployment_start || '',
        dep.deployment_end || '',
        dep.camera_id || '',
        '', // cameraModel
        '', // cameraHeight
        '', // cameraDepth
        '', // cameraTilt
        '', // cameraHeading
        '', // detectionDistance
        '', // baitUse
        '', // timestampIssues
        dep.deployment_comments || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `camtrap-deployments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToKML = () => {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>CamTrap Deployments</name>\n    <description>Camera trap deployments exported from CamTrap Field Ops</description>\n    ${deployments
      .filter(dep => typeof dep.latitude === 'number' && typeof dep.longitude === 'number')
      .map(dep => `\n    <Placemark>\n      <name>${dep.location_name || dep.location_id || 'Unknown Location'}</name>\n      <description>\n        <![CDATA[\n          <b>Deployment ID:</b> ${dep.deployment_id}<br/>\n          <b>Camera ID:</b> ${dep.camera_id || 'N/A'}<br/>\n          <b>Start Date:</b> ${dep.deployment_start || 'N/A'}<br/>\n          <b>End Date:</b> ${dep.deployment_end || 'Active'}<br/>\n          <b>Status:</b> ${dep.deployment_end ? 'Inactive' : 'Active'}<br/>\n          <b>Comments:</b> ${dep.deployment_comments || 'None'}\n        ]]>\n      </description>\n      <Point>\n        <coordinates>${dep.longitude},${dep.latitude},0</coordinates>\n      </Point>\n    </Placemark>`)
      .join('')}\n  </Document>\n</kml>`;
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `camtrap-deployments-${new Date().toISOString().split('T')[0]}.kml`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToGeoJSON = () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: deployments
        .filter(dep => typeof dep.latitude === 'number' && typeof dep.longitude === 'number')
        .map(dep => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [dep.longitude, dep.latitude]
          },
          properties: {
            deploymentID: dep.deployment_id,
            projectID: dep.project_id || '',
            locationID: dep.location_id || '',
            locationName: dep.location_name || '',
            deploymentStart: dep.deployment_start || '',
            deploymentEnd: dep.deployment_end || '',
            cameraID: dep.camera_id || '',
            cameraModel: '',
            cameraHeight: null,
            cameraDepth: null,
            cameraTilt: null,
            cameraHeading: null,
            detectionDistance: null,
            baitUse: null,
            timestampIssues: null,
            deploymentComments: dep.deployment_comments || '',
            status: dep.deployment_end ? 'Inactive' : 'Active'
          }
        }))
    };
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/geo+json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `camtrap-deployments-${new Date().toISOString().split('T')[0]}.geojson`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render deployments on map with clustering
  useEffect(() => {
    if (!mapContainer.current) return;
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v11',
        center: [-99.5, 49.73], // Set to requested center
        zoom: 9, // Set to requested zoom
      });
    }

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create GeoJSON features from deployments
    const points: PointFeature<{
      deployment: Deployment;
      cluster: boolean;
      deployment_id: string;
      location_name?: string;
      camera_id?: string;
    }>[] = deployments
      .filter(dep => typeof dep.longitude === 'number' && typeof dep.latitude === 'number')
      .map((dep) => ({
        type: 'Feature' as const,
        properties: {
          deployment: dep,
          cluster: false,
          deployment_id: dep.deployment_id,
          location_name: dep.location_name,
          camera_id: dep.camera_id
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [dep.longitude as number, dep.latitude as number]
        }
      }));

    // Initialize supercluster
    clusterRef.current = new Supercluster({
      radius: 40,
      maxZoom: 16
    });
    clusterRef.current.load(points);

    const updateMarkers = () => {
      if (!mapRef.current || !clusterRef.current) return;

      // Remove old markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      const bounds = mapRef.current.getBounds();
      if (!bounds) return;
      const zoom = Math.floor(mapRef.current.getZoom());
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];
      
      const clusters = clusterRef.current.getClusters(bbox, zoom);

      clusters.forEach(cluster => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        
        if ((cluster.properties as { cluster?: boolean }).cluster) {
          // This is a cluster
          const count = (cluster.properties as { point_count: number }).point_count;
          const el = createClusterMarker(count);
          
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);

          // Add click handler to zoom into cluster
          marker.getElement().addEventListener('click', () => {
            if (!clusterRef.current) return;
            const clusterId = (cluster as any).id;
            if (typeof clusterId !== 'number') return;
            const expansionZoom = Math.min(clusterRef.current.getClusterExpansionZoom(clusterId), 20);
            mapRef.current!.flyTo({
              center: [longitude, latitude],
              zoom: expansionZoom
            });
          });

          markersRef.current.push(marker);
        } else {
          // This is an individual deployment
          const dep = (cluster.properties as { deployment: Deployment }).deployment;
          const el = createDeploymentMarker();
          
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setHTML(
              `<div style='min-width:120px'>${getLocationName(dep.location_name ?? "")}${dep.camera_id ? ` [${dep.camera_id}]` : ''}<br/>MGRS: ${mgrsForward([dep.longitude, dep.latitude])}<br/><a href='/deployments/${dep.deployment_id}' style='color:#2563eb;text-decoration:underline'>View Details</a></div>`
            ))
            .addTo(mapRef.current!);

          markersRef.current.push(marker);
        }
      });

      if (mapRef.current) {
        const bounds = mapRef.current.getBounds();
        if (bounds) {
          setMapBounds([
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()]
          ]);
        }
      }
    };

    // Update markers when map moves
    mapRef.current.on('moveend', updateMarkers);
    mapRef.current.on('zoomend', updateMarkers);
    
    // Initial marker update
    updateMarkers();

    setTimeout(() => {
      mapRef.current?.resize();
    }, 200);

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.off('moveend', updateMarkers);
        mapRef.current.off('zoomend', updateMarkers);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployments, locations]);

  // Filter deployments to those in current map view
  const filteredDeployments = mapBounds
    ? deployments.filter(dep => {
        if (typeof dep.longitude !== 'number' || typeof dep.latitude !== 'number') return false;
        const [[swLng, swLat], [neLng, neLat]] = mapBounds;
        return (
          dep.longitude >= swLng && dep.longitude <= neLng &&
          dep.latitude >= swLat && dep.latitude <= neLat
        );
      })
    : deployments;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Deployments</h1>
        <div className="flex items-center space-x-2">
          {/* Export Button */}
          <div className="relative" ref={exportMenuRef}>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center space-x-2"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              
              
              
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={exportToCSV}
                  >
                    Export as CSV
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={exportToKML}
                  >
                    Export as KML
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={exportToGeoJSON}
                  >
                    Export as GeoJSON
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* New Deployment Button */}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowSelector((v) => !v)}
          >
            {showSelector ? "Cancel" : <MapPinPlus className="w-4 h-4"/>}
            
          </button>
        </div>
      </div>
      {showSelector && (
        <div className="mt-4">
          <DeploymentLocationSelector onDeploymentCreated={fetchDeploymentsAndLocations} />
        </div>
      )}
      <div className="mt-10">
        <div className="mb-2 text-sm text-gray-600">
          <span className="inline-flex items-center mr-4">
            <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
            Clusters (click to zoom)
          </span>
          <span className="inline-flex items-center">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            Individual deployments
          </span>
        </div>
        <div ref={mapContainer} style={{ width: '100%', height: 350, borderRadius: 8, overflow: 'hidden' }} />
      </div>
      <div className="mt-8">
        {filteredDeployments.length === 0 ? (
          <p className="text-gray-500">No deployments found in the current map view.</p>
        ) : (
          <ul className="space-y-2">
            {filteredDeployments.map((dep) => {
              let mgrsCoord = '';
              if (typeof dep.latitude === 'number' && typeof dep.longitude === 'number') {
                try {
                  mgrsCoord = mgrsForward([dep.longitude, dep.latitude]);
                } catch {}
              }
              return (
                <li key={dep.deployment_id} className="p-2 bg-white rounded shadow border text-sm">
                  <Link href={`/deployments/${dep.deployment_id}`} className="block hover:bg-blue-50 rounded p-1 transition-colors">
                    <div className="font-medium">
                      Location: {getLocationName(dep.location_name ?? "")}
                      {dep.camera_id && (
                        <span className="mx-2 text-gray-400">&bull;</span>
                      )}
                      {dep.camera_id && (
                        <span>Camera: {dep.camera_id}</span>
                      )}
                    </div>
                    <div>Start: {formatDate(dep.deployment_start)}</div>
                    {mgrsCoord && <div className="text-xs text-gray-500">MGRS: {mgrsCoord}</div>}
                    {dep.deployment_end && <div>End: {formatDate(dep.deployment_end)}</div>}
                    <div className={dep.deployment_end ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      Status: {dep.deployment_end ? 'Inactive' : 'Active'}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
    </div>
  );
} 