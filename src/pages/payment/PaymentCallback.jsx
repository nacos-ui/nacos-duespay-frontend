import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PaymentCallback() {
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference_id') || params.get('reference') || params.get('ref');
    const paymentStatus = params.get('status');

    if (!reference) {
      setDebugInfo(`Missing reference. Available params: ${Array.from(params.keys()).join(', ')}`);
      setStatus('error');
      setTimeout(() => {
        window.location.href = `${window.location.origin}/pay`;
      }, 3000);
      return;
    }

    setStatus('redirecting');
    const redirectStatus = paymentStatus || 'pending';
    const redirectUrl = `${window.location.origin}/pay?reference=${reference}&status=${redirectStatus}`;

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);

  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-sm w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-10 w-10 text-gray-900 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing</h2>
            <p className="text-sm text-gray-500">Validating payment details...</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verified</h2>
            <p className="text-sm text-gray-500">Redirecting to status page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-sm text-gray-500 mb-4">Invalid reference found.</p>
            {debugInfo && (
              <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded break-all">
                {debugInfo}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-4">Returning to home...</p>
          </>
        )}
      </div>
    </div>
  );
}