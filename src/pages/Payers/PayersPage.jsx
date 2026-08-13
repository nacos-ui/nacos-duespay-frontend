import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import MainLayout from "../../layouts/mainLayout";
import PayersTable from "./components/PayersTable";
import PayerDetailsModal from "./components/PayerDetailsModal"; 
import PayerTransactionsModal from "./components/PayerTransactionsModal";
import TransactionDetailsModal from "../Transactions/components/TransactionDetailsModal";
import Pagination from "../Transactions/components/Pagination";
import ConfirmationModal from "../../components/ConfirmationModal";
import { API_ENDPOINTS } from "../../apiConfig";  
import { usePageTitle } from "../../hooks/usePageTitle";
import { fetchWithTimeout, handleFetchError } from "../../utils/fetchUtils";
import { exportPayers } from "../../utils/exportUtils"; 
import { useSession } from "../../contexts/SessionContext";

const PAGE_SIZE = 7;

export default function PayersPage() {
  const [payers, setPayers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [associationType, setAssociationType] = useState("");

  // Bulk actions
  const [selectedPayers, setSelectedPayers] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(''); 

  // Get current session from context
  const { currentSession, loading: sessionLoading } = useSession();

  usePageTitle("Payers - DuesPay");

  // Filters
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");

  // Modals
  const [selectedPayer, setSelectedPayer] = useState(null);
  const [showPayerDetails, setShowPayerDetails] = useState(false);
  const [showPayerTransactions, setShowPayerTransactions] = useState(false);
  const [selectedMatric, setSelectedMatric] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Fetch association type (to conditionally show/hide faculty filter)
  useEffect(() => {
    const fetchAssocType = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetchWithTimeout(API_ENDPOINTS.GET_ASSOCIATION, {
          headers: { Authorization: `Bearer ${token}` }
        }, 15000);
        if (res.ok) {
          const data = await res.json();
          const assoc = data?.data?.results?.[0] || data?.data || null;
          setAssociationType(assoc?.association_type || "");
        }
      } catch (e) {
        // silent fail – filter just stays visible
      }
    };
    fetchAssocType();
  }, []);

  // Fetch payers
  const fetchPayers = async (page = 1, isBackgroundFetch = false) => {
    // Don't fetch if no current session
    if (!currentSession?.id) {
      if (!isBackgroundFetch) setLoading(false);
      return;
    }

    if (!isBackgroundFetch) setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();

      // Add session filter
      params.append("session_id", currentSession.id);

      if (search) params.append("search", search);
      if (faculty) params.append("faculty", faculty);
      if (department) params.append("department", department);
      params.append("page", page);

      const res = await fetchWithTimeout(`${API_ENDPOINTS.GET_PAYERS}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }, 30000);

      if (!res.ok) {
        if (isBackgroundFetch) {
          console.error("Background fetch for payers failed.");
          return;
        }
        throw new Error("Failed to fetch payers");
      }
      const responseData = await res.json();
      const data = responseData.data;
      setPayers(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      const { message } = handleFetchError(err);
      console.error("Error fetching payers:", message);
      if (!isBackgroundFetch) {
        setPayers([]);
        setCount(0);
      }
    } finally {
      if (!isBackgroundFetch) setLoading(false);
    }
  };

  // Bulk delete payers
  const bulkDeletePayers = async () => {
    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      // Send delete requests for each selected payer
      const promises = selectedPayers.map(payerId =>
        fetchWithTimeout(`${API_ENDPOINTS.GET_PAYERS}${payerId}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }, 30000)
      );

      await Promise.all(promises);

      setShowBulkModal(false);
      setSelectedPayers([]);
      fetchPayers(page);

    } catch (err) {
      const { message } = handleFetchError(err);
      alert(`Bulk delete failed: ${message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle bulk action
  const handleBulkAction = (actionType) => {
    setBulkActionType(actionType);
    setShowBulkModal(true);
  };

  // Execute bulk action
  const executeBulkAction = () => {
    if (bulkActionType === 'delete') {
      bulkDeletePayers();
    }
  };

  // Handle export using utility function - now includes session
  const handleExport = () => {
    exportPayers(search, faculty, department, setExportLoading, currentSession?.id);
  };

  // Get bulk modal content
  const getBulkModalContent = () => {
    const count = selectedPayers.length;
    if (bulkActionType === 'delete') {
      return {
        title: "Delete Payers",
        message: `Are you sure you want to delete ${count} selected payer${count > 1 ? 's' : ''}? This action cannot be undone and will also delete all their transactions.`,
        confirmText: "Delete",
        type: "danger"
      };
    }
    return {};
  };

  useEffect(() => {
    // Listen for session changes
    const handleSessionChange = () => {
      console.log('Session changed - refetching payers');
      fetchPayers(1); // Reset to page 1 when session changes
      setPage(1);
      setSelectedPayers([]); // Clear selections
    };

    window.addEventListener('sessionChanged', handleSessionChange);
    return () => window.removeEventListener('sessionChanged', handleSessionChange);
  }, [currentSession?.id]);

  useEffect(() => {
    fetchPayers(page);
    // eslint-disable-next-line
  }, [page, search, faculty, department, currentSession?.id]);

  // Poll for new payers
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only poll on the first page and without filters to keep it simple
      if (page === 1 && !search && !faculty && !department) {
        fetchPayers(1, true); // true for background fetch
      }
    }, 5000); // Poll every 5 seconds. You can adjust this value.

    return () => clearInterval(intervalId); // Cleanup when component unmounts or dependencies change
  }, [page, search, faculty, department, currentSession?.id]);

  // Show loading while session is loading
  if (sessionLoading) {
    return (
      <MainLayout>
        <div className="bg-[#0F111F] min-h-screen sm:pt-16 pt-16 sm:p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading session...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show no session message
  if (!currentSession) {
    return (
      <MainLayout>
        <div className="bg-[#0F111F] min-h-screen sm:pt-16 pt-16 sm:p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">No Active Session</h1>
            <p className="text-gray-400 mb-6">
              Please select a session to view payers.
            </p>
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-[#0F111F] min-h-screen sm:pt-16 pt-16 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Payers List</h1>
          <p className="text-gray-400">A list of all students who have submitted payment proofs for {currentSession.title}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="Search by name, matric number, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#23263A] border border-[#23263A] text-white px-4 py-2 rounded w-64 focus:outline-none"
          />
          {associationType !== "faculty" && (
            <input
              type="text"
              placeholder="All Faculties"
              value={faculty}
              onChange={e => setFaculty(e.target.value)}
              className="bg-[#23263A] border border-[#23263A] text-white px-4 py-2 rounded"
            />
          )}
          <input
            type="text"
            placeholder="All Departments"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="bg-[#23263A] border border-[#23263A] text-white px-4 py-2 rounded"
          />
          <button 
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {exportLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedPayers.length > 0 && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-white font-medium">
                {selectedPayers.length} payer{selectedPayers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors disabled:opacity-50 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete All</span>
                  <span className="sm:inline">Delete</span>
                </button>
                <button
                  onClick={() => setSelectedPayers([])}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <PayersTable
          totalPayers={count} 
          payers={payers}
          loading={loading}
          onViewDetails={payer => {
            setSelectedPayer(payer);
            setShowPayerDetails(true);
          }}
          selectedPayers={selectedPayers}
          setSelectedPayers={setSelectedPayers}
          page={page}
          pageSize={PAGE_SIZE}
        />
        
        <Pagination
          count={count}
          page={page}
          setPage={setPage}
          pageSize={7}
        />
        
        {showPayerDetails && selectedPayer && (
          <PayerDetailsModal
            payer={selectedPayer}
            onClose={() => setShowPayerDetails(false)}
            onViewTransactions={payer => {
              setSelectedMatric(payer.matric_number);
              setShowPayerTransactions(true);
            }}
          />
        )}
        
        {showPayerTransactions && selectedMatric && (
          <PayerTransactionsModal
            matricNumber={selectedMatric}
            sessionId={currentSession?.id}
            onClose={() => setShowPayerTransactions(false)}
            onViewTransaction={tx => setSelectedTransaction(tx)}
          />
        )}
        
        {selectedTransaction && (
          <TransactionDetailsModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}

        {/* Bulk Action Confirmation Modal */}
        <ConfirmationModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onConfirm={executeBulkAction}
          loading={bulkActionLoading}
          {...getBulkModalContent()}
        />
      </div>
    </MainLayout>
  );
}