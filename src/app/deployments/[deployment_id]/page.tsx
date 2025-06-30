import React from 'react';

export default function DeploymentDetailPage({ params }: { params: { deployment_id: string } }) {
  // Unwrap params for Next.js 15+
  const unwrappedParams = React.use(params) as { deployment_id: string };
  const deployment_id = unwrappedParams.deployment_id;

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
} 