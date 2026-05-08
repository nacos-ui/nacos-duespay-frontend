import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = ({ message }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f111f]">
      <div className="w-full max-w-lg mx-auto text-center p-8 rounded-2xl shadow-2xl bg-[#23263a] border border-[#101828]">
        <div className="font-mono text-sm text-gray-500 mb-4 text-left bg-[#101828] rounded-lg px-4 py-3">
          <span className="text-green-400">GET</span>{' '}
          <span className="text-yellow-300">{window.location.pathname}</span>{' '}
          <span className="text-red-400">404 Not Found</span>
        </div>
        <h1 className="text-7xl font-extrabold text-[#8200db] mb-3 tracking-tight font-mono">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page.exe has stopped working.</h2>
        <p className="text-lg text-gray-300 mb-6">
          {message || (
            <>
              The resource you requested{' '}
              <span className="text-[#8200db] font-semibold font-mono">null</span>
              {' '}— it was never there, or someone deleted it and didn't write a migration.
              <br />
              <span className="italic text-gray-400 text-base">
                Have you tried turning the URL off and on again?
              </span>
            </>
          )}
        </p>
        <button
          onClick={() => navigate('/pay')}
          className="inline-block px-8 py-3 bg-[#8200db] text-white rounded-xl font-semibold shadow hover:bg-purple-700 transition-colors font-mono"
        >
          {'>'} go /pay
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;