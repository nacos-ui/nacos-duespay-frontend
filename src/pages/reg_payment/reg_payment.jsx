import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, User, CreditCard, Receipt } from 'lucide-react';
import Header from './components/Header';
import RegistrationStep from './components/RegistrationStep';
import PaymentSelectionStep from './components/PaymentSelectionStep';
import VirtualAccountPayment from './components/VirtualAccountPayment';
import PaymentStatusStep from './components/PaymentStatusStep';
import NavigationButtons from './components/NavigationButtons';
import SidebarSummary from './components/SidebarSummary';
import ErrorModal from '../../components/ErrorModal';
import { fetchWithTimeout, handleFetchError } from '../../utils/fetchUtils';
import { API_ENDPOINTS } from '../../apiConfig';
import { usePageBranding } from "../../hooks/usePageBranding";
import { isColorDark } from "./utils/colorUtils";
import { pickId, generateThemeStyles, sanitizeName } from "./utils/themeUtils";
import NotFoundPage from '../404_page';

// Add this function before the component definition
const filterAndProcessPaymentItems = (paymentItems, payerLevel) => {
  if (!paymentItems || !payerLevel) return paymentItems || [];

  return paymentItems
    .filter(item => item.is_active) // Only show active items
    .map(item => {
      // Check if this item is compulsory for the payer's level
      const isCompulsoryForPayer = item.status === 'compulsory' &&
        item.compulsory_for &&
        (item.compulsory_for.includes(payerLevel) || item.compulsory_for.includes('All Levels'));

      return {
        ...item,
        // Override status based on payer's level
        status: isCompulsoryForPayer ? 'compulsory' : 'optional'
      };
    });
};

const DuesPayPaymentFlow = () => {

  // Get URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const paymentReference = urlParams.get('reference');
  const paymentStatus = urlParams.get('status');

  const [currentStep, setCurrentStep] = useState(paymentReference ? 4 : 1);
  const [payerData, setPayerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    level: '',
    phoneNumber: '',
    matricNumber: '',
    faculty: '',
    department: '',
  });

  const [associationData, setAssociationData] = useState(null);
  const [paymentItems, setPaymentItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [payerId, setPayerId] = useState(null);
  const [referenceId, setReferenceId] = useState(paymentReference || null);

  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const [modalError, setModalError] = useState({ open: false, title: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [paymentStatusData, setPaymentStatusData] = useState(null);

  // 🔥 NEW: Virtual account data
  const [virtualAccountData, setVirtualAccountData] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  const themeColor = associationData?.theme_color || '#9810fa';
  const isDarkTheme = isColorDark(themeColor);

  // Dynamic page branding with favicon
  usePageBranding({
    title: currentStep === 1 ? "Registration" :
      currentStep === 2 ? "Payment Selection" :
        currentStep === 3 ? "Payment Process" :
          "Payment Status",
    faviconUrl: associationData?.logo_url,
    associationName: associationData?.association_name
  });

  // Fetch the single association (no shortname needed)
  useEffect(() => {
    const fetchAssociation = async () => {
      console.log("📡 Starting fetch for single association");

      setLoadError(null);

      try {
        const res = await fetchWithTimeout(
          API_ENDPOINTS.GET_SINGLE_ASSOCIATION,
          {},
          20000
        );

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('ASSOCIATION_NOT_FOUND');
          }
          throw new Error(`HTTP ${res.status}: Failed to fetch association`);
        }

        const responseData = await res.json();
        const data = responseData.data;

        console.log("✅ Association loaded:", data?.association_name);

        setAssociationData(data);
        setPaymentItems(data.payment_items || []);

        setLoadError(null);
      } catch (err) {
        console.error("❌ Association fetch error:", err);

        if (err.message === 'ASSOCIATION_NOT_FOUND') {
          setLoadError("Association not found");
        } else {
          const { message } = handleFetchError(err);
          setModalError({
            open: true,
            title: "Connection Error",
            message: message || "Unable to load association details. Please check your connection."
          });
        }

        setAssociationData(null);
        setPaymentItems([]);
        setSelectedItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssociation();
  }, []); // Empty dependency array since we're not using shortname anymore

  // 🔥 NEW: Payment status polling
  const pollPaymentStatus = async () => {
    if (!referenceId) return;

    try {
      const res = await fetchWithTimeout(
        API_ENDPOINTS.PAYMENT_STATUS(referenceId),
        {},
        10000
      );
      const responseData = await res.json();

      if (res.ok && responseData.data) {
        const data = responseData.data;
        setPaymentStatusData(data);

        // If payment is verified, stop polling and move to final step
        if (data.is_verified || data.status === 'verified' || data.payment_status === 'verified') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setCurrentStep(4);
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      // Don't show error modal for polling failures
    }
  };

  // 🔥 NEW: Start polling when on virtual account step
  useEffect(() => {
    if (currentStep === 3 && referenceId && !pollingInterval) {
      // Poll immediately
      pollPaymentStatus();

      // Then poll every 10 seconds
      const interval = setInterval(pollPaymentStatus, 10000);
      setPollingInterval(interval);
    }

    // Cleanup polling when leaving step or component unmounts
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [currentStep, referenceId]);

  // Fetch payment status if we have a reference on step 4
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!referenceId) return;

      setStatusLoading(true);
      try {
        const res = await fetchWithTimeout(
          API_ENDPOINTS.PAYMENT_STATUS(referenceId),
          {},
          20000
        );
        const responseData = await res.json();
        if (res.ok) {
          const data = responseData.data;
          setPaymentStatusData(data);
        } else {
          throw new Error('Failed to fetch payment status');
        }
      } catch (err) {
        const { message } = handleFetchError(err);
        setModalError({
          open: true,
          title: "Status Error",
          message: message || "Could not fetch payment status"
        });
      } finally {
        setStatusLoading(false);
      }
    };

    if (currentStep === 4) {
      fetchPaymentStatus();
    }
  }, [referenceId, currentStep]);

  // Add new useEffect to update selectedItems when payer level changes
  useEffect(() => {
    if (paymentItems.length > 0 && payerData.level) {
      const processedItems = filterAndProcessPaymentItems(paymentItems, payerData.level);

      // Auto-select compulsory items for this payer's level
      const compulsoryItems = processedItems
        .filter(item => item.status === 'compulsory')
        .map(item => item.id);

      setSelectedItems(compulsoryItems);
    }
  }, [paymentItems, payerData.level]);

  const handleItemSelection = (itemId) => {
    const processedItems = filterAndProcessPaymentItems(paymentItems, payerData.level);
    const item = processedItems.find(i => i.id === itemId);

    // Prevent deselecting compulsory items
    if (item && item.status === 'compulsory') return;

    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Update getTotalAmount to use processed items
  const getTotalAmount = () => {
    const processedItems = filterAndProcessPaymentItems(paymentItems, payerData.level);

    return selectedItems.reduce((total, itemId) => {
      const item = processedItems.find(p => p.id === itemId);
      return total + (item ? Number(item.amount) : 0);
    }, 0);
  };

  const registrationStepRef = useRef();

  // STEP 1: Payer check → save payer_id
  const checkPayer = async () => {
    setRegError("");
    setRegLoading(true);
    try {
      const res = await fetchWithTimeout(
        API_ENDPOINTS.PAYER_CHECK,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            association_short_name: associationData?.association_short_name,
            matric_number: payerData.matricNumber,
            email: payerData.email,
            level: payerData.level,
            phone_number: payerData.phoneNumber,
            first_name: sanitizeName(payerData.firstName),
            last_name: sanitizeName(payerData.lastName),
            faculty: payerData.faculty,
            department: payerData.department,
          }),
        },
        30000
      );
      const responseData = await res.json();
      const data = responseData.data;

      if (!res.ok || !responseData?.success) {
        if (data && typeof data === 'object' && !data.error) {
          registrationStepRef.current?.setBackendErrors?.(data);
          setRegError("Please fix the errors below.");
        } else {
          setRegError(data?.error || "Registration error. Please check your details.");
        }
        setRegLoading(false);
        return false;
      }

      if (responseData?.payer_id) setPayerId(responseData.payer_id);
      if (!responseData?.payer_id && responseData?.data?.payer_id) setPayerId(responseData.data.payer_id);

      setRegError("");
      setRegLoading(false);
      return true;
    } catch (err) {
      const { message } = handleFetchError(err);
      setRegError(message);
      setRegLoading(false);
      return false;
    }
  };

  // 🔥 UPDATED: STEP 2: Initiate payment → get virtual account data
  const initiatePayment = async () => {
    try {
      setPayLoading(true);
      if (!payerId) throw new Error("Missing payer identifier.");

      const association_id =
        associationData?.association?.id ??
        associationData?.id ??
        associationData?.association_id ??
        (paymentItems?.[0]?.association ?? null);

      const session_id =
        pickId(associationData?.association?.current_session) ??
        pickId(associationData?.association?.active_session) ??
        pickId(associationData?.current_session) ??
        pickId(associationData?.active_session) ??
        pickId(associationData?.session) ??
        associationData?.session_id ??
        (paymentItems?.[0]?.session ?? null);

      if (!association_id || !session_id) {
        throw new Error("Missing association/session information.");
      }
      if (!selectedItems.length) {
        throw new Error("Please select at least one item.");
      }

      const endpoint = API_ENDPOINTS.PAYMENT_INITIATE;
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error("PAYMENT_INITIATE endpoint is not configured.");
      }

      const payer_name = sanitizeName(
        `${payerData.firstName || ''} ${payerData.lastName || ''}`.trim()
      );
      const payer_email = String(payerData.email || '').trim();

      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payer_id: payerId,
            association_id,
            session_id,
            payment_item_ids: selectedItems,
            payer_name,
            payer_email,
          }),
        },
        30000
      );

      let responseData;
      try {
        responseData = await res.json();
      } catch {
        responseData = null;
      }

      console.log("Payment Initiate Response:", responseData); // Debug log

      // 🔥 FIX: Check for success field instead of just res.ok
      if (!res.ok || !responseData?.success) {
        const backendMsg = responseData?.message || responseData?.data?.message || responseData?.data?.detail || responseData?.data?.error;
        throw new Error(backendMsg || "Failed to initiate payment.");
      }

      const data = responseData.data;

      // 🔥 NEW: Handle Korapay bank transfer response
      if (data.bank_account && data.reference_id) {
        console.log("Bank transfer data received:", data); // Debug log

        // Transform the response to match VirtualAccountPayment component expectations
        const transformedData = {
          accountNumber: data.bank_account.account_number,
          accountName: data.bank_account.account_name,
          bankName: data.bank_account.bank_name,
          bankCode: data.bank_account.bank_code,
          amount: parseFloat(data.amount),
          totalPayable: parseFloat(data.total_payable),
          total_payable_with_fee: data.total_payable,
          paymentReference: data.reference_id,
          expiresOn: data.bank_account.expiry_date_in_utc,
          accountDurationSeconds: data.bank_account.expiry_seconds,
          customer: data.customer,
          narration: data.narration,
          fee: data.fee || 0,
          vat: data.vat || 0,
          amount_expected: data.amount_expected
        };

        setVirtualAccountData(transformedData);
        setReferenceId(data.reference_id);
        setCurrentStep(3); // Go to virtual account step
        setPayLoading(false);
        return;
      }

      // 🔥 FALLBACK: Handle old Monnify virtual account format
      if (data.accountNumber && data.paymentReference) {
        console.log("Virtual account data received:", data); // Debug log
        setVirtualAccountData(data);
        setReferenceId(data.paymentReference);
        setCurrentStep(3); // Go to virtual account step
        setPayLoading(false);
        return;
      }

      // 🔥 FALLBACK: Handle old checkout URL format
      if (data.checkout_url && data.reference_id) {
        setReferenceId(data.reference_id);
        window.location.href = data.checkout_url;
        return;
      }

      throw new Error("Invalid payment response format.");

    } catch (err) {
      console.error("Payment initiation error:", err); // Debug log
      const { message } = handleFetchError(err);
      setModalError({
        open: true,
        title: "Payment Error",
        message,
      });
      setPayLoading(false);
    }
  };

  // 🔥 NEW: Handle manual payment verification check
  const handleCheckPayment = async () => {
    setStatusLoading(true);
    await pollPaymentStatus();
    setStatusLoading(false);
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const validationError = registrationStepRef.current?.validate?.();
      if (validationError) return;
      if (!(await checkPayer())) return;
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      await initiatePayment();
      return;
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && currentStep < 3) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          payerData.firstName &&
          payerData.lastName &&
          payerData.email &&
          payerData.level &&
          payerData.matricNumber &&
          payerData.phoneNumber
        );
      case 2:
        return selectedItems.length > 0;
      default:
        return false;
    }
  };

  const formatTotal = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const steps = [
    { number: 1, title: "Payer Information", icon: User },
    { number: 2, title: "Payment Selection", icon: CreditCard },
    { number: 3, title: "Payment Process", icon: CreditCard },
    { number: 4, title: "Payment Status", icon: Receipt },
  ];

  // 🔥 IMPROVED LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-700">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: themeColor }} />
          <h3 className="text-lg font-semibold mb-2">
            {paymentReference ? "Loading Payment Status" : "Loading Association"}
          </h3>
          <p className="text-gray-500">
            {paymentReference
              ? "Please wait while we fetch your payment details..."
              : "Setting up your payment portal..."
            }
          </p>
          {paymentReference && (
            <div className="mt-4 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Payment Reference</p>
              <p className="font-mono text-sm">{paymentReference}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 🔥 ONLY SHOW 404 FOR CONFIRMED ERRORS
  if (loadError === "Association not found") {
    return <NotFoundPage message="This association does not exist or is not available." />;
  }

  // 🔥 FALLBACK FOR MISSING DATA WITH PAYMENT REFERENCE
  if (!associationData && paymentReference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Data Loading</h3>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the association details for your payment.
            </p>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="text-xs text-gray-500 mb-1">Reference</p>
              <p className="font-mono text-sm">{paymentReference}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 FINAL FALLBACK - SHOULDN'T HAPPEN
  if (!associationData) {
    return <NotFoundPage message="Unable to load association data." />;
  }

  return (
    <>
      <ErrorModal
        open={modalError.open}
        onClose={() => setModalError({ ...modalError, open: false })}
        title={modalError.title}
        message={modalError.message}
      />

      <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
        <Header
          associationData={associationData}
          themeColor={themeColor}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left Column: Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Mobile Step Indicator */}
              <div className="lg:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Current Step</span>
                  <span className="text-sm font-bold text-gray-900">
                    {currentStep} / {steps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%`, backgroundColor: themeColor }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {steps[currentStep - 1]?.title}
                </p>
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <div className={`transition-all duration-300 ${currentStep === 4 ? "p-0 h-full" : "p-6 md:p-8"}`}>
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Student Information</h2>
                        <p className="text-gray-500">Please enter your details to verify your identity.</p>
                      </div>
                      <RegistrationStep
                        ref={registrationStepRef}
                        payerData={payerData}
                        handleInputChange={(f, v) => setPayerData(prev => ({ ...prev, [f]: v }))}
                        error={regError}
                        loading={regLoading}
                        associationData={associationData}
                        themeColor={themeColor}
                      />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Select Payments</h2>
                        <p className="text-gray-500">Choose the items you wish to pay for.</p>
                      </div>
                      <PaymentSelectionStep
                        paymentItems={filterAndProcessPaymentItems(paymentItems, payerData.level)}
                        selectedItems={selectedItems}
                        handleItemSelection={handleItemSelection}
                        associationData={associationData}
                        getTotalAmount={getTotalAmount}
                        themeColor={themeColor}
                        hideBankDetails
                      />
                    </div>
                  )}

                  {currentStep === 3 && virtualAccountData && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Make Payment</h2>
                        <p className="text-gray-500">Transfer the exact amount to the account below.</p>
                      </div>
                      <VirtualAccountPayment
                        accountData={virtualAccountData}
                        onPaymentVerified={() => setCurrentStep(4)}
                        onCheckPayment={handleCheckPayment}
                        themeColor={themeColor}
                        referenceId={referenceId}
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <PaymentStatusStep
                      referenceId={referenceId}
                      paymentStatus={paymentStatus}
                      statusData={paymentStatusData}
                      loading={statusLoading}
                      themeColor={themeColor}
                    />
                  )}
                </div>

                {/* Navigation Buttons Area (Inside Card for unified look, or could be outside) */}
                {currentStep < 3 && (
                  <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-100">
                    <NavigationButtons
                      currentStep={currentStep}
                      canProceed={canProceed}
                      regLoading={regLoading}
                      payLoading={payLoading}
                      prevStep={prevStep}
                      nextStep={nextStep}
                      themeColor={themeColor}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sidebar (Detailed Summary) */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <SidebarSummary
                  paymentItems={filterAndProcessPaymentItems(paymentItems, payerData.level)}
                  selectedItems={selectedItems}
                  themeColor={themeColor}
                  getTotalAmount={getTotalAmount}
                  formatTotal={formatTotal}
                  steps={steps}
                  currentStep={currentStep}
                />
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default DuesPayPaymentFlow;