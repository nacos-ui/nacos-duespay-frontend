import { useState } from "react";
import { X } from "lucide-react";
import { API_ENDPOINTS } from "../../../apiConfig";
import { fetchWithTimeout, handleFetchError } from "../../../utils/fetchUtils";

export default function TransactionDetailsModal({ transaction, onClose, onStatusChange }) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  if (!transaction) return null;

  const handleVerifyToggle = async () => {
    setVerifying(true);
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetchWithTimeout(API_ENDPOINTS.DETAIL_TRANSACTION(transaction.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_verified: !transaction.is_verified,
        }),
      }, 20000); // 15 second timeout for transaction verification toggle
      
      if (!res.ok) throw new Error("Failed to update status");
      if (onStatusChange) onStatusChange();
      if (onClose) onClose(); 
    } catch (err) {
      const errorInfo = handleFetchError(err);
      setError(errorInfo.message || "Could not update verification status.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111fbe] backdrop-blur-lg">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl shadow-2xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Transaction Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Transaction Reference ID</span>
              <div className="text-white font-semibold">{transaction.reference_id}</div>
            </div>
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Payer Name</span>
              <div className="text-white">{transaction.payer_name}</div>
            </div>
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Payment Items</span>
              <div className="text-white">{transaction.payment_item_titles?.join(", ")}</div>
            </div>
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Amount Paid</span>
              <div className="text-white">₦{Number(transaction.amount_paid).toLocaleString()}</div>
            </div>
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Date and Time of Payment</span>
              <div className="text-white">
                {new Date(transaction.submitted_at).toLocaleDateString()} at {new Date(transaction.submitted_at).toLocaleTimeString()}
              </div>
            </div>
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Verification Status</span>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  transaction.is_verified
                    ? "bg-green-800 text-green-300"
                    : transaction.is_expired
                    ? "bg-red-800 text-red-300"
                    : "bg-yellow-800 text-yellow-300"
                }`}>
                  {transaction.is_verified ? "Verified" : transaction.is_expired ? "Expired" : "Pending"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className={`px-6 py-2 rounded font-semibold ${
                  transaction.is_verified
                    ? "bg-yellow-800 text-yellow-200 hover:bg-yellow-700"
                    : "bg-green-800 text-green-200 hover:bg-green-700"
                }`}
                onClick={handleVerifyToggle}
                disabled={verifying}
              >
                {verifying
                  ? "Processing..."
                  : transaction.is_verified
                  ? "Mark as Pending"
                  : "Mark as Verified"}
              </button>
              {transaction.is_verified && transaction.receipt_id && (
                <button
                  className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  onClick={() => window.open(`/transactions/receipt/${transaction.receipt_id}`, '_blank')}
                >
                  View Receipt
                </button>
              )}
              <button
                className="px-6 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            {error && <div className="text-red-400 mt-2">{error}</div>}
          </div>
          {/* <div>
            <span className="text-gray-400 text-sm">Proof of Payment</span>
            <div className="mt-2 bg-gray-800 rounded-lg p-2 flex items-center justify-center min-h-[180px]">
              {transaction.proof_of_payment?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={transaction.proof_of_payment_url}
                  alt="Proof of Payment"
                  className="max-h-40 rounded"
                />
              ) : (
                <a
                  href={transaction.proof_of_payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 underline"
                >
                  View Document
                </a>
              )}
            </div>
            {transaction.proof_of_payment && transaction.proof_of_payment.match(/\.(jpg|jpeg|png|gif)$/i) && (
              <div className="text-center mt-2">
                <a
                  href={transaction.proof_of_payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 underline"
                >
                  View Full Image
                </a>
              </div>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
}