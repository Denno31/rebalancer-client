'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bot } from '@/utils/api';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  botList?: Bot[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  onToggle, 
  botList = [] 
}) => {
  const [botsExpanded, setBotsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleBots = () => {
    setBotsExpanded(!botsExpanded);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isBotDetailsActive = () => {
    return pathname.startsWith('/bot-details');
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-[#1E2026] text-white z-10 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} shadow-lg`}>
      <div className="flex justify-between items-center h-16 px-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-yellow-400" viewBox="0 0 16 16">
            <path d="M5.5 13v1.25c0 .138.112.25.25.25h1a.25.25 0 0 0 .25-.25V13h.5v1.25c0 .138.112.25.25.25h1a.25.25 0 0 0 .25-.25V13h.084c1.992 0 3.416-1.033 3.416-2.82 0-1.502-1.007-2.323-2.186-2.44v-.088c.97-.242 1.683-.974 1.683-2.208C11.997 3.996 10.845 3 9.087 3H9v1.25a.25.25 0 0 1-.25.25h-1a.25.25 0 0 1-.25-.25V3h-.573V1.75a.25.25 0 0 0-.25-.25h-1a.25.25 0 0 0-.25.25V3h-.5V1.75a.25.25 0 0 0-.25-.25h-1a.25.25 0 0 0-.25.25V3h-.5a.513.513 0 0 0-.5.5c0 .253.224.5.5.5h.5v9h.5v-9h1v9h.5v-9h.5a.25.25 0 0 1 .25.25v.57l-.003.002-.001.001-.004.002-.006.003a4.75 4.75 0 0 1-.12.058l-.075.036-.009.004-.025.012-.032.015-.004.002-.031.014-.004.002-.039.019-.036.017-.014.006-.05.024-.004.002c-.225.107-.4.25-.554.403a2.53 2.53 0 0 0-.33.412c-.085.135-.092.257-.103.288A1 1 0 0 0 8 6.5v9a1.5 1.5 0 0 0 3 0v-.499c0-.175.156-.317.349-.338a.5.5 0 0 0 .65-.474v-8.17c0-.175.156-.318.35-.338A.5.5 0 0 0 13 5.5v7.499a3 3 0 0 1-6 0v-9a1.5 1.5 0 0 1 1.172-1.466c.253-.115.352-.392.352-.655 0-.225-.145-.436-.352-.552A2.014 2.014 0 0 0 6.5 1.8v7.7c0 .275-.175.5-.45.5H4v-7.5a.5.5 0 0 0-.5-.5H1.999c-.275 0-.5.225-.5.5v8c0 .275.225.5.5.5h2.976c.136 0 .264-.053.359-.146a.5.5 0 0 0 .119-.354v-8a.5.5 0 0 0-.5-.5h-1.5v8h1v-7.5A1.5 1.5 0 0 1 5 1.5v7.5c0 .138.112.25.25.25H5.5V13z"/>
          </svg>
          {!collapsed && <span className="font-semibold text-lg whitespace-nowrap">Crypto Rebalancer</span>}
        </div>
        <button 
          onClick={onToggle}
          className="text-gray-400 hover:text-white focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi" viewBox="0 0 16 16">
            <path fillRule="evenodd" d={collapsed ? "M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" : "M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"} />
          </svg>
        </button>
      </div>

      <nav className="mt-4">
        <Link href="/dashboard" passHref>
          <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${isActive('/dashboard') ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
              <path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z"/>
            </svg>
            {!collapsed && <span>Dashboard</span>}
          </div>
        </Link>

        <div className="mt-2">
          <div 
            onClick={toggleBots}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer ${isBotDetailsActive() ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
                <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/>
              </svg>
              {!collapsed && <span>Bots</span>}
            </div>
            {!collapsed && (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d={botsExpanded ? "M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" : "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"} />
              </svg>
            )}
          </div>
          
          {botsExpanded && !collapsed && (
            <div className="ml-7 mt-1">
              <Link href="/bots" passHref>
                <div className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isActive('/bots') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                  <span className="text-sm">All Bots</span>
                </div>
              </Link>
              
              {botList.map(bot => (
                <Link key={bot.id} href={`/bot-details/${bot.id}`} passHref>
                  <div className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isActive(`/bot-details/${bot.id}`) ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                    <div className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-sm truncate">{bot.name}</span>
                    {bot.currentCoin && (
                      <span className="text-xs text-gray-500 ml-auto">{bot.currentCoin}</span>
                    )}
                  </div>
                </Link>
              ))}
              
              <Link href="/new-bot" passHref>
                <div className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${isActive('/new-bot') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  <span className="text-sm">New Bot</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <Link href="/analytics" passHref>
          <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer mt-1 ${isActive('/analytics') ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.5 1.018a7 7 0 0 0-4.79 11.566L7.5 7.793V1.018zm1 0v6.775l4.79 4.79A7 7 0 0 0 8.5 1.018zm4.084 12.273L8.5 9.207v5.775a6.97 6.97 0 0 0 4.084-1.691zM7.5 14.982V9.207l-4.084 4.084A6.97 6.97 0 0 0 7.5 14.982zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
            </svg>
            {!collapsed && <span>Analytics</span>}
          </div>
        </Link>

        <Link href="/settings" passHref>
          <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer mt-1 ${isActive('/settings') ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
            {!collapsed && <span>Settings</span>}
          </div>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
