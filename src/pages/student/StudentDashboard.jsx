import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, RefreshCw, FileText, ChevronRight, X, Clock, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { API_ENDPOINTS } from '../../apiConfig';
import { fetchWithTimeout, handleFetchError } from '../../utils/fetchUtils';
import ErrorModal from '../../components/ErrorModal';
import Header from '../reg_payment/components/Header';
import { usePageBranding } from '../../hooks/usePageBranding';
import { useAssociationData } from '../../hooks/useAssociationData';

const TransactionModal = ({ transaction, onClose, onRefresh, themeColor, loadingRef }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-lg border border-gray-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Reference</span>
            <span className="font-medium font-mono text-gray-900 dark:text-white">{transaction.reference_id}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              ₦{parseFloat(transaction.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Session</span>
            <span className="font-medium text-gray-900 dark:text-white">{transaction.session_title || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(transaction.submitted_at).toLocaleDateString()}
            </span>
          </div>

          {transaction.payment_item_titles && transaction.payment_item_titles.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Items Paid For</span>
              <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                {transaction.payment_item_titles.join(', ')}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              transaction.is_verified 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : transaction.is_expired
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {transaction.is_verified ? <CheckCircle2 className="w-4 h-4" /> : transaction.is_expired ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {transaction.is_verified ? 'Verified' : transaction.is_expired ? 'Expired' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
          
          {transaction.is_verified && transaction.receipt_id ? (
            <button
              onClick={() => window.open(`/transactions/receipt/${transaction.receipt_id}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <FileText className="w-4 h-4" />
              View Receipt
            </button>
          ) : !transaction.is_verified && !transaction.is_expired ? (
            <button
              onClick={() => onRefresh(transaction.reference_id)}
              disabled={loadingRef === transaction.reference_id}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-70"
              style={{ backgroundColor: themeColor }}
            >
              {loadingRef === transaction.reference_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh Status
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshLoading, setRefreshLoading] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [student, setStudent] = useState(null);
  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '' });
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { associationData, themeColor, loading: brandingLoading } = useAssociationData();

  const uniqueSessions = useMemo(() => {
    const unique = [];
    const map = new Map();
    for (const txn of transactions) {
      if (!map.has(txn.session)) {
        map.set(txn.session, true);
        unique.push({ id: txn.session, title: txn.session_title });
      }
    }
    return unique;
  }, [transactions]);

  useEffect(() => {
    if (uniqueSessions.length > 0 && !selectedSession) {
      const activeSession = associationData?.current_session;
      if (activeSession) {
        const match = uniqueSessions.find(s => s.id === activeSession.id);
        if (match) {
          setSelectedSession(match);
          return;
        }
      }
      setSelectedSession(uniqueSessions[0]);
    }
  }, [uniqueSessions, selectedSession, associationData]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (selectedSession) {
      result = result.filter(t => t.session === selectedSession.id);
    }
    
    if (statusFilter !== 'All') {
      result = result.filter(t => {
        if (statusFilter === 'Verified') return t.is_verified;
        if (statusFilter === 'Expired') return !t.is_verified && t.is_expired;
        if (statusFilter === 'Pending') return !t.is_verified && !t.is_expired;
        return true;
      });
    }
    
    return result;
  }, [transactions, selectedSession, statusFilter]);

  usePageBranding({
    title: 'Student Dashboard',
    faviconUrl: associationData?.logo_url,
    associationName: associationData?.association_name
  });

  useEffect(() => {
    const token = localStorage.getItem('student_access_token');
    const studentData = localStorage.getItem('student_data');
    
    if (!token || !studentData) {
      navigate('/student/login');
      return;
    }
    
    setStudent(JSON.parse(studentData));
    fetchTransactions(token);
  }, [navigate]);

  const fetchTransactions = async (token) => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.STUDENT_TRANSACTIONS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      const responseData = data.data || data;

      if (!res.ok) {
        throw new Error(responseData.error || data.error || data.message || 'Failed to fetch transactions');
      }
      
      setTransactions(responseData.transactions || responseData.results || []);
    } catch (err) {
      const { message } = handleFetchError(err);
      if (message.includes('Unauthorized') || message.includes('Token has expired') || message.includes('Authentication failed')) {
        handleLogout();
      } else {
        setErrorModal({ open: true, title: 'Error', message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_access_token');
    localStorage.removeItem('student_data');
    navigate('/student/login');
  };

  const handleRefreshStatus = async (referenceId) => {
    setRefreshLoading(referenceId);
    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.PAYMENT_STATUS(referenceId));
      const rawData = await res.json();
      const data = rawData.data || rawData;
      
      if (data.is_verified || data.status === 'verified' || data.payment_status === 'verified') {
        // Update local transaction state
        setTransactions(prev => prev.map(t => 
          t.reference_id === referenceId ? { ...t, is_verified: true } : t
        ));
        // Update selected modal if open
        setSelectedTxn(prev => prev && prev.reference_id === referenceId ? { ...prev, is_verified: true } : prev);
      } else {
        setErrorModal({ open: true, title: 'Status check', message: 'Transaction is still pending.' });
      }
    } catch (err) {
      const { message } = handleFetchError(err);
      setErrorModal({ open: true, title: 'Status Check Failed', message });
    } finally {
      setRefreshLoading(null);
    }
  };

  if (brandingLoading || (loading && transactions.length === 0)) {
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
      
      <Header 
        associationData={associationData} 
        themeColor={themeColor}
        studentLoggedIn={!!student}
        onLogout={handleLogout}
      />
      
      <TransactionModal 
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
        onRefresh={handleRefreshStatus}
        themeColor={themeColor}
        loadingRef={refreshLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome, {student?.first_name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Matric: {student?.matric_number}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment History</h3>
            
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>

              {uniqueSessions.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>Active Session - {selectedSession?.title}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 overflow-hidden">
                      {uniqueSessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setSelectedSession(session);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            selectedSession?.id === session.id
                              ? 'bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {session.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found for this session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Reference</th>
                    <th className="px-6 py-4 font-medium">Session</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredTransactions.map((txn) => (
                    <tr 
                      key={txn.reference_id} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-300">
                        {txn.reference_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {txn.session_title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                        ₦{parseFloat(txn.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          txn.is_verified 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : txn.is_expired
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {txn.is_verified ? 'Verified' : txn.is_expired ? 'Expired' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(txn.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-400 inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
