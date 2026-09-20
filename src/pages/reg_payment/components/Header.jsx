import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ associationData, themeColor, studentLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  if (!associationData) return null;

  return (
    <div className="bg-slate-900 text-white w-full border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={associationData.logo_url}
              alt="Logo"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-700 bg-white"
            />
          </div>

          {/* Association Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold truncate sm:hidden">
                {associationData.association_short_name?.toUpperCase()}
              </h1>
              <h1 className="hidden sm:block text-xl font-bold truncate">
                {associationData.association_name}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {associationData.association_short_name}
              </span>
            </div>
            <p className="text-sm text-slate-400 truncate">Official Payment Portal</p>
          </div>
        </div>

        {/* Login/Logout Button */}
        <div className="flex-shrink-0">
          {studentLoggedIn ? (
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-red-500 hover:bg-red-900/30 text-red-500"
            >
              Sign Out
            </button>
          ) : (
            <button 
              onClick={() => navigate('/student/login')}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:bg-slate-800 text-white"
              style={{ borderColor: themeColor }}
            >
              Student Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;