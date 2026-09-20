import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { API_ENDPOINTS } from "../../../apiConfig";
import { fetchWithTimeout, handleFetchError } from "../../../utils/fetchUtils";

export default function PayerTransactionsModal({ payer, onClose, onViewTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetchWithTimeout(`${API_ENDPOINTS.GET_TRANSACTIONS}?payer_id=${payer.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }, 20000); // 10 second timeout for fetching payer transactions
        
        const responseData = await res.json();
        if (res.ok) {
          const data = responseData.data;
          setTransactions(data.results || []);
        } else {
          console.error('Failed to fetch payer transactions');
          setTransactions([]);
        }
      } catch (error) {
        const errorInfo = handleFetchError(error);
        console.error('Error fetching payer transactions:', errorInfo.message);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    if (payer?.id) fetchTransactions();
  }, [payer?.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111fbe] backdrop-blur-lg">
      <div className="bg-gray-900 rounded-xl p-8 w-[95%] max-w-3xl shadow-2xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Transactions for {payer?.matric_number}</h2>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="py-2 min-w-[8rem]">REFERENCE ID</th>
                <th className="py-2 min-w-[12rem]">PAYMENT ITEM</th>
                <th className="py-2 min-w-[8rem]">AMOUNT</th>
                <th className="py-2 min-w-[8rem]">DATE</th>
                <th className="py-2 min-w-[8rem]">STATUS</th>
                <th className="py-2 min-w-[8rem]">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">Loading...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={tx.id || idx} className="border-t border-gray-800">
                    <td className="py-2 text-white font-medium">{tx.reference_id}</td>
                    <td className="py-2 text-white">{tx.payment_item_titles?.join(", ")}</td>
                    <td className="py-2 text-white">₦{Number(tx.amount_paid).toLocaleString()}</td>
                    <td className="py-2 text-gray-300">{new Date(tx.submitted_at).toLocaleDateString()}</td>
                    <td className="py-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tx.is_verified
                          ? "bg-green-800 text-green-300"
                          : "bg-yellow-800 text-yellow-300"
                      }`}>
                        {tx.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        className="text-purple-600 hover:underline font-semibold"
                        onClick={() => onViewTransaction(tx)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-6">
          <button
            className="px-6 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}