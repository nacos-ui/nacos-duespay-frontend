import { useEffect, useState } from "react";
import MainLayout from "../../layouts/mainLayout";
import Pagination from "../Transactions/components/Pagination";
import { API_BASE_URL } from "../../apiConfig";
import { usePageTitle } from "../../hooks/usePageTitle";
import { fetchWithTimeout, handleFetchError } from "../../utils/fetchUtils";
import { useSession } from "../../contexts/SessionContext";

const PAGE_SIZE = 7;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");

  const { currentSession, loading: sessionLoading } = useSession();

  usePageTitle("Receipts - DuesPay");

  const fetchReceipts = async (page = 1, isBackgroundFetch = false) => {
    if (!currentSession?.id) {
      if (!isBackgroundFetch) setLoading(false);
      return;
    }

    if (!isBackgroundFetch) setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();

      params.append("session_id", currentSession.id);
      if (search) params.append("search", search);
      params.append("page", page);

      const res = await fetchWithTimeout(`${API_BASE_URL}/api/transactions/admin-receipts/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }, 30000);

      if (!res.ok) {
        throw new Error("Failed to fetch receipts");
      }
      const responseData = await res.json();
      
      const data = responseData.data || responseData;
      setReceipts(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching receipts:", err);
      if (!isBackgroundFetch) {
        setReceipts([]);
        setCount(0);
      }
    } finally {
      if (!isBackgroundFetch) setLoading(false);
    }
  };

  useEffect(() => {
    const handleSessionChange = () => {
      fetchReceipts(1);
      setPage(1);
    };

    window.addEventListener('sessionChanged', handleSessionChange);
    return () => window.removeEventListener('sessionChanged', handleSessionChange);
  }, [currentSession?.id]);

  useEffect(() => {
    fetchReceipts(page);
    // eslint-disable-next-line
  }, [page, search, currentSession?.id]);

  const viewReceipt = (receiptId) => {
    window.open(`/transactions/receipt/${receiptId}`, '_blank');
  };

  const SkeletonRow = ({ index }) => (
    <tr key={index} className="border-t border-gray-800">
      <td className="py-4 w-10"><div className="h-4 w-6 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[8rem]"><div className="h-4 w-20 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[8rem]"><div className="h-4 w-20 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[10rem]"><div className="h-4 w-32 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[10rem]"><div className="h-4 w-32 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[8rem]"><div className="h-4 w-16 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[10rem]"><div className="h-4 w-24 bg-gray-700 rounded animate-pulse" /></td>
      <td className="py-4 min-w-[8rem]"><div className="h-4 w-20 bg-gray-700 rounded animate-pulse" /></td>
    </tr>
  );

  if (sessionLoading) {
    return (
      <MainLayout>
        <div className="bg-[#0F111F] min-h-screen pt-16 sm:p-6 sm:pt-16">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading session...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentSession) {
    return (
      <MainLayout>
        <div className="bg-[#0F111F] min-h-screen pt-16 sm:p-6 sm:pt-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">No Active Session</h1>
            <p className="text-gray-400 mb-6">Please select a session to view receipts.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-[#0F111F] min-h-screen pt-16 sm:p-6 sm:pt-16">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Receipts</h1>
            <p className="text-gray-400">A list of all issued receipts for {currentSession.title}</p>
          </div>
          <button 
            onClick={() => fetchReceipts(page, false)}
            className="flex items-center gap-2 bg-[#23263A] hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="Search by receipt no, matric, name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#23263A] border border-[#23263A] text-white px-4 py-2 rounded w-80 focus:outline-none"
          />
        </div>

        <div className="bg-gray-900 rounded-xl p-6 shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Receipts List</h2>
            <h2 className="text-sm font-normal text-white/40">
              {loading ? (
                <span className="inline-block h-4 w-24 bg-gray-700 rounded animate-pulse align-middle" />
              ) : (
                `${count || 0} receipts`
              )}
            </h2>
          </div>
          
          <div className="overflow-x-auto hide-scrollbar w-full">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="py-2 w-10 text-gray-500">S/N</th>
                  <th className="py-2 min-w-[8rem]">RECEIPT NO</th>
                  <th className="py-2 min-w-[8rem]">MATRIC</th>
                  <th className="py-2 min-w-[10rem]">NAME</th>
                  <th className="py-2 min-w-[10rem]">EMAIL</th>
                  <th className="py-2 min-w-[8rem]">AMOUNT PAID</th>
                  <th className="py-2 min-w-[10rem]">ISSUED AT</th>
                  <th className="py-2 min-w-[8rem]">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} index={i} />)
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-6">No receipts found.</td>
                  </tr>
                ) : (
                  receipts.map((receipt, idx) => {
                    const serialNumber = (page - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={receipt.id || receipt.receipt_id || idx} className="border-t border-gray-800">
                        <td className="py-4 w-10 text-gray-500 text-sm">{serialNumber}</td>
                        <td className="py-4 text-white min-w-[8rem] font-medium">{receipt.receipt_no}</td>
                        <td className="py-4 text-white min-w-[8rem]">{receipt.payer_matric || 'N/A'}</td>
                        <td className="py-4 text-white min-w-[10rem]">
                          {receipt.payer_first_name} {receipt.payer_last_name}
                        </td>
                        <td className="py-4 text-gray-300 min-w-[10rem]">{receipt.payer_email}</td>
                        <td className="py-4 text-green-400 font-semibold min-w-[8rem]">
                          ₦{Number(receipt.amount_paid).toLocaleString()}
                        </td>
                        <td className="py-4 text-gray-400 min-w-[10rem]">
                          {new Date(receipt.issued_at || receipt.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 min-w-[8rem]">
                          <button
                            className="text-purple-600 hover:underline font-semibold"
                            onClick={() => viewReceipt(receipt.receipt_id)}
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          count={count}
          page={page}
          setPage={setPage}
          pageSize={PAGE_SIZE}
        />
      </div>
    </MainLayout>
  );
}
