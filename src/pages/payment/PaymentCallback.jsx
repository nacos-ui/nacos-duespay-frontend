import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PaymentCallback() {
  const location = useLocation();
  const [status, setStatus] = useState('processing'); // processing, error, redirecting
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Debug logging
    console.log("🔄 PaymentCallback Debug:");
    console.log("📍 Full URL:", window.location.href);
    console.log("📋 All params:", Object.fromEntries(params.entries()));

    const reference = params.get('reference_id') || params.get('reference') || params.get('ref');
    const paymentStatus = params.get('status');

    console.log("🎯 Extracted:", { reference, paymentStatus });

    // Validation - only reference is required now
    if (!reference) {
      console.error("❌ Missing required parameter: reference");
      setDebugInfo(`Missing reference. Available: ${Array.from(params.keys()).join(', ')}`);
      setStatus('error');

      // Redirect back to /pay
      setTimeout(() => {
        window.location.href = `${window.location.origin}/pay`;
      }, 3000);
      return;
    }

    // Success - prepare redirect back to /pay page
    setStatus('redirecting');
    const redirectStatus = paymentStatus || 'pending';

    // Redirect to /pay with reference and status
    const redirectUrl = `${window.location.origin}/pay?reference=${reference}&status=${redirectStatus}`;

    console.log("🚀 Redirecting to:", redirectUrl);

    // Single redirect with small delay for UX
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);

  }, []); // Empty dependency array - run once only

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-md mx-4">

        {status === 'processing' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
              <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">
              Validating payment details...
            </p>
          </div>
        )}

        {status === 'redirecting' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-6">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Received</h2>
            <p className="text-gray-600">
              Redirecting to payment status page...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">
              Unable to process payment callback
            </p>
            {debugInfo && (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                {debugInfo}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Redirecting back...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}