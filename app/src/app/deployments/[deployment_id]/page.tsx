// Server component for deployment detail page
import DeploymentDetailClient from "@/components/DeploymentDetailClient";
import React from "react";

interface PageProps {
  params: {
    deployment_id: string;
  };
}

export default function DeploymentDetailPage({ params }: PageProps) {
  // Extract deployment_id and pass as prop
  return <DeploymentDetailClient deployment_id={params.deployment_id} />;
}