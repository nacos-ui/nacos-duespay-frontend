import React from 'react';

const Header = ({ associationData, themeColor }) => {
  if (!associationData) return null;

  return (
    <div className="bg-slate-900 text-white w-full border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
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
            <h1 className="text-lg md:text-xl font-bold truncate">
              {associationData.association_name}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {associationData.association_short_name}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">Official Payment Portal</p>
        </div>

        {/* Optional: Simple Contact Indicator */}
        <div className="hidden sm:block text-right">
          <div className="text-xs text-slate-500 font-medium">Have issues?</div>
          <a href="mailto:support@duespay.com" className="text-sm font-medium hover:text-white transition-colors" style={{ color: themeColor }}>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;