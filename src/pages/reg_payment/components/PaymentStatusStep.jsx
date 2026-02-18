import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Receipt, RefreshCw, XCircle } from 'lucide-react';
import { fetchWithTimeout } from '../../../utils/fetchUtils';
import { API_ENDPOINTS } from '../../../apiConfig';
import { useNavigate } from 'react-router-dom';

const PaymentStatusStep = ({
  referenceId,
  paymentStatus,
  statusData: initialStatusData,
  loading: initialLoading,
  themeColor
}) => {
  const [statusData, setStatusData] = useState(initialStatusData);
  const [loading, setLoading] = useState(initialLoading);
  const [pollCount, setPollCount] = useState(0);
  const navigate = useNavigate();

  const viewReceipt = () => {
    if (referenceId && statusData?.receipt_id) {
      window.open(`/transactions/receipt/${statusData.receipt_id}`, '_blank');
    }
  };

  const goHome = () => {
    // Navigate to /pay but force a refresh or state reset effectively
    window.location.href = '/pay';
  };

  useEffect(() => {
    if (!referenceId) return;
    if (statusData?.is_verified && statusData?.exists) return;

    let stopped = false;
    const maxPolls = 30;

    const pollStatus = async () => {
      if (stopped || pollCount >= maxPolls) return;

      setLoading(true);
      setPollCount(prev => prev + 1);

      try {
        const res = await fetchWithTimeout(
          API_ENDPOINTS.PAYMENT_STATUS(referenceId),
          {},
          20000
        );

        if (res.ok) {
          const responseData = await res.json();
          const data = responseData.data;
          setStatusData(data);

          if (data?.is_verified || data?.exists === false) {
            stopped = true;
          }
        }
      } catch (err) {
        console.error('Status polling error:', err);
      } finally {
        setLoading(false);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [referenceId, pollCount, statusData?.is_verified, statusData?.exists]);

  const getStatusContent = () => {
    if (loading && !statusData) {
      return {
        icon: Loader2,
        title: 'Verifying Payment',
        message: 'Please wait while we confirm your transaction...',
        color: 'text-gray-500',
        animate: true
      };
    }

    if (statusData?.exists && statusData?.is_verified) {
      return {
        icon: CheckCircle2,
        title: 'Payment Successful',
        message: 'Your transaction has been verified successfully.',
        color: 'text-emerald-600',
        isSuccess: true
      };
    }

    if (statusData?.exists && !statusData?.is_verified) {
      return {
        icon: AlertCircle,
        title: 'Pending Verification',
        message: 'We have received your request but are still waiting for bank confirmation.',
        color: 'text-amber-500'
      };
    }

    if (statusData && !statusData.exists) {
      return {
        icon: XCircle,
        title: 'Payment Not Found',
        message: 'We could not locate this payment reference.',
        color: 'text-red-600'
      };
    }

    // Fallback based on URL param
    if (paymentStatus === 'success') {
      return {
        icon: CheckCircle2,
        title: 'Payment Successful',
        message: 'Your transaction has been processed.',
        color: 'text-emerald-600',
        isSuccess: true
      };
    }

    return {
      icon: RefreshCw,
      title: 'Checking Status',
      message: 'Verifying payment status...',
      color: 'text-blue-600'
    };
  };

  const content = getStatusContent();
  const Icon = content.icon;
  const isSuccess = content.isSuccess || (statusData?.is_verified && statusData?.exists);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${content.isSuccess ? 'bg-emerald-50' : 'bg-gray-50'}`}>
        <Icon className={`w-10 h-10 ${content.color} ${content.animate ? 'animate-spin' : ''}`} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
      <p className="text-gray-500 mb-8">{content.message}</p>

      {statusData && (
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 text-left mb-8 w-full max-w-md">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Transaction Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reference</span>
              <span className="text-sm font-medium text-gray-900 font-mono">{referenceId}</span>
            </div>
            {statusData.amount_paid && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount Paid</span>
                <span className="text-sm font-bold text-gray-900">
                  ₦{parseFloat(statusData.amount_paid).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-sm font-medium ${statusData.is_verified ? 'text-emerald-600' : 'text-amber-500'}`}>
                {statusData.is_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
            {statusData.receipt_id && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                <span className="text-sm text-gray-600">Receipt</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Available</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isSuccess && (
          <button
            onClick={viewReceipt}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: themeColor }}
          >
            <Receipt className="w-4 h-4" />
            View Receipt
          </button>
        )}

        {!isSuccess && !loading && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
        )}

        <button
          onClick={goHome}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Go Home
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default PaymentStatusStep;