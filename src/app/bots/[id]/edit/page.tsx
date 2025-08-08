'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EditBotForm from '@/components/bots/EditBotForm';

export default function EditBotPage() {
  const params = useParams();
  const botId = parseInt(params.id as string);

  if (isNaN(botId)) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Invalid Bot ID</h1>
          <p>The bot ID provided is not valid.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <EditBotForm botId={botId} />
      </div>
    </DashboardLayout>
  );
}
