"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DataService } from "@/lib/data-service";
import type { MaintenanceVisit } from "@/lib/db";
import Link from "next/link";

export default function MaintenanceVisitDetailPage() {
  const params = useParams();
  const { deployment_id, visit_id } = params as { deployment_id: string; visit_id: string };
  const [visit, setVisit] = useState<MaintenanceVisit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVisit() {
      setLoading(true);
      const allVisits = await DataService.getMaintenanceVisits();
      const found = allVisits.find(v => v.visit_id === visit_id);
      setVisit(found || null);
      setLoading(false);
    }
    fetchVisit();
  }, [visit_id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!visit) return <div className="p-8 text-center text-red-600">Visit not found.</div>;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <Link href={`/deployments/${deployment_id}`} className="mb-6 text-blue-600 hover:underline block">&larr; Back to Deployment</Link>
      <div className="bg-white rounded shadow p-6 border">
        <h1 className="text-2xl font-bold mb-4">Maintenance Visit Details</h1>
        <div className="mb-2"><span className="font-semibold">Visit Date:</span> {visit.visit_date?.slice(0, 10)}</div>
        <div className="mb-2"><span className="font-semibold">Visit Type:</span> {visit.visit_type}</div>
        <div className="mb-2"><span className="font-semibold">Technician:</span> {visit.technician_name}</div>
        <div className="mb-2"><span className="font-semibold">Camera Functioning:</span> {visit.camera_functioning ? "Yes" : "No"}</div>
        <div className="mb-2"><span className="font-semibold">Battery Changed:</span> {visit.battery_changed ? "Yes" : "No"}</div>
        <div className="mb-2"><span className="font-semibold">SD Card Changed:</span> {visit.sd_card_changed ? "Yes" : "No"}</div>
        <div className="mb-2"><span className="font-semibold">Camera Repositioned:</span> {visit.camera_repositioned ? "Yes" : "No"}</div>
        <div className="mb-2"><span className="font-semibold">Camera Cleaned:</span> {visit.camera_cleaned ? "Yes" : "No"}</div>
        <div className="mb-2"><span className="font-semibold">Camera Repaired:</span> {visit.camera_repaired ? "Yes" : "No"}</div>
        <div className="mb-2"><span className="font-semibold">Notes:</span> {visit.visit_notes || <span className="text-gray-400">None</span>}</div>
        {/* Add more fields as needed */}
      </div>
    </div>
  );
} 