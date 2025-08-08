'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { usePathname } from 'next/navigation';
import { fetchBots } from '@/utils/api';
import { Bot } from '@/types/botTypes';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [username, setUsername] = useState('User');
  const [botList, setBotList] = useState<Bot[]>([]);
  const pathname = usePathname();
  
  // Get username from localStorage on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    // Load bots for sidebar
    loadBots();
  }, []);
  
  const loadBots = async () => {
    try {
      // Fetch actual bot data from the API
      const botsData = await fetchBots();
      // Map API response to bots with status derived from enabled field
      const processedBots = botsData.map(bot => ({
        ...bot,
        status: bot.enabled ? 'active' : 'inactive'
      }));
      setBotList(processedBots);
    } catch (error) {
      console.error('Error fetching bots for sidebar:', error);
      // Set empty array as fallback
      setBotList([]);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/bots') return 'Bots';
    if (pathname.startsWith('/bot-details/')) return 'Bot Details';
    if (pathname === '/new-bot') return 'New Bot';
    if (pathname === '/analytics') return 'Analytics';
    if (pathname === '/settings') return 'Settings';
    
    // Default: capitalize first letter
    const pageName = pathname.split('/').pop() || '';
    return pageName.charAt(0).toUpperCase() + pageName.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#12161C] text-gray-200">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        botList={botList}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        <TopBar 
          username={username} 
          onLogout={handleLogout}
          pageTitle={getPageTitle()}
        />
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
