import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, HelpCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../../apiConfig';
import { fetchWithTimeout, handleFetchError } from '../../utils/fetchUtils';
import ErrorModal from '../../components/ErrorModal';
import Header from '../reg_payment/components/Header';
import { usePageBranding } from '../../hooks/usePageBranding';
import { useAssociationData } from '../../hooks/useAssociationData';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Lookup, 2: OTP
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });
  
  const [matricNumber, setMatricNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [countdown, setCountdown] = useState(0);

  const { associationData, themeColor, loading: brandingLoading } = useAssociationData();

  usePageBranding({
    title: 'Student Login',
    faviconUrl: associationData?.logo_url,
    associationName: associationData?.association_name
  });

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.STUDENT_REQUEST_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric_number: matricNumber })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.data?.error || data?.error || data?.message || "Failed to request OTP");
      }
      
      const responsePayload = data.data || data;
      setMaskedEmail(responsePayload.masked_email || "your registered email");
      setCountdown(60); // Start 60 second countdown
      setStep(2);
    } catch (err) {
      const { message } = handleFetchError(err);
      setErrorModal({ open: true, title: 'Error', message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.STUDENT_VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matric_number: matricNumber,
          otp_code: otpCode
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.data?.error || data?.error || data?.message || "Failed to verify OTP");
      }
      
      const responsePayload = data.data || data;
      
      // Save token and navigate
      localStorage.setItem('student_access_token', responsePayload.access);
      localStorage.setItem('student_data', JSON.stringify(responsePayload.student || {}));
      navigate('/student/dashboard');
      
    } catch (err) {
      const { message } = handleFetchError(err);
      setErrorModal({ open: true, title: 'Error', message });
    } finally {
      setLoading(false);
    }
  };

  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <ErrorModal
        open={errorModal.open}
        onClose={() => setErrorModal({ ...errorModal, open: false })}
        title={errorModal.title}
        message={errorModal.message}
      />
      
      <Header associationData={associationData} themeColor={themeColor} />

      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Student Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to view your payment history and receipts
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-sm border border-gray-100 dark:border-slate-700 sm:rounded-2xl sm:px-10">
            
            {step === 1 ? (
              <form className="space-y-6" onSubmit={handleRequestOTP}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Matriculation Number
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      placeholder="Enter your matric number"
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-slate-900 dark:text-white transition-colors"
                      style={{ focusRingColor: themeColor }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You can only log in if you have previously initiated or completed a payment on the platform.
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !matricNumber.trim()}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all disabled:opacity-50 hover:shadow-md transform hover:-translate-y-0.5"
                    style={{ backgroundColor: themeColor }}
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Request OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-6 animate-fade-in" onSubmit={handleVerifyOTP}>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-xl text-sm mb-4">
                  An OTP has been sent to <strong>{maskedEmail}</strong>. It expires in 10 minutes.
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter 6-Digit OTP
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-slate-900 dark:text-white transition-colors text-center text-2xl tracking-widest font-bold"
                      placeholder="------"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpCode('');
                      setCountdown(0);
                    }}
                    className="text-sm font-medium hover:opacity-80 transition-opacity"
                    style={{ color: themeColor }}
                  >
                    Change Matric Number
                  </button>
                  
                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleRequestOTP}
                    className="text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: countdown > 0 ? '#6b7280' : themeColor }}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all disabled:opacity-50 hover:shadow-md transform hover:-translate-y-0.5"
                    style={{ backgroundColor: themeColor }}
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
