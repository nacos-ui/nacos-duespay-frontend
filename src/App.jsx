import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Overview from './pages/dashboard/Overview';
import Auth from './pages/auth/auth';
import ProtectedRoute from './components/ProtectedRoute';
import PaymentItems from './pages/paymentItem/paymentItem';
import DuesPayPaymentFlow from './pages/reg_payment/reg_payment';
import AssociationForm from './pages/create_association/create_association';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import PayersPage from './pages/Payers/PayersPage';
import SettingsPage from './pages/settingsPage/SettingsPage';
import CreateSessionPage from './pages/sessions/CreateSessionPage';
import ErrorBoundaryWithModal from './components/ErrorBoundaryWithModal';
import { SessionProvider } from './contexts/SessionContext';
import PasswordResetConfirm from './pages/auth/passwordResetConfirm';
import NotFoundPage from './pages/404_page';
import ReceiptPage from './pages/receipt/receipt';
import { ErrorProvider } from './contexts/ErrorContext';
import PaymentCallback from './pages/payment/PaymentCallback';
import { useGlobalError } from './contexts/ErrorContext';
import { setGlobalErrorSetter } from './utils/api';

function App() {
  function GlobalErrorSetter() {
    const { setModalError } = useGlobalError();
    React.useEffect(() => {
      setGlobalErrorSetter(setModalError);
    }, [setModalError]);
    return null;
  }

  return (
    <ErrorBoundaryWithModal>
      <ErrorProvider>
        <GlobalErrorSetter />
        <SessionProvider>
          <Router>
            <Routes>
              {/* Home route now redirects to /pay */}
              <Route path='/' element={<Navigate to="/pay" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<PasswordResetConfirm />} />
              <Route path="/transactions/receipt/:receipt_id" element={<ReceiptPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard/overview" element={<Overview />} />
                <Route path="/dashboard/payment-items" element={<PaymentItems />} />
                <Route path="/dashboard/transactions" element={<TransactionsPage />} />
                <Route path="/create-association" element={<AssociationForm />} />
                <Route path="/dashboard/students" element={<PayersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/dashboard/sessions/new" element={<CreateSessionPage />} />
              </Route>

              <Route path="/payment/callback" element={<PaymentCallback />} />

              {/* Static /pay route replaces dynamic /:shortName route */}
              <Route path="/pay" element={<DuesPayPaymentFlow />} />

              {/* Catch-all 404 for unregistered routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </SessionProvider>
      </ErrorProvider>
    </ErrorBoundaryWithModal>
  );
}

export default App;