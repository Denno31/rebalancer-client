'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TopBarProps {
  username: string;
  onLogout: () => void;
  pageTitle: string;
}

const TopBar: React.FC<TopBarProps> = ({ username, onLogout, pageTitle }) => {
  const [notifications, setNotifications] = useState(3); // Mock notifications count
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="flex justify-between items-center h-16 px-6 bg-[#1A1D24] text-white border-b border-gray-700">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative">
          <input
            type="search"
            placeholder="Search bots, coins..."
            className="bg-[#2A2E37] text-gray-300 pl-8 pr-4 py-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 w-64"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* Help */}
        <button className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
        </div>
        
        {/* Settings */}
        <Link href="/settings" passHref>
          <div className="text-gray-400 hover:text-white cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
        </Link>
        
        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="flex items-center space-x-2 bg-[#2A2E37] hover:bg-[#343A46] py-2 px-3 rounded-md transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black font-medium">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm">{username}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 py-1 bg-[#2A2E37] rounded-md shadow-lg z-50 border border-gray-700">
              <Link href="/profile" passHref>
                <div className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                  Profile
                </div>
              </Link>
              <div 
                onClick={onLogout} 
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
