'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BotForm from '@/components/bots/BotForm';

export default function CreateBotPage() {
  return (
    <DashboardLayout>
      <div className="p-4">
        <h1 className="text-2xl font-semibold text-white mb-6">Create Bot</h1>
        <BotForm />
      </div>
    </DashboardLayout>
  );
}
