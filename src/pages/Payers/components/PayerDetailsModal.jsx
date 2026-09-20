import { X } from "lucide-react";

export default function PayerDetailsModal({ payer, onClose, onViewTransactions }) { 
  if (!payer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111fbe] backdrop-blur-lg">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Payer Details</h2>
        <div className="space-y-3">
          <div>
            <span className="text-gray-400 text-sm">Name</span>
            <div className="text-white font-semibold">{payer.first_name} {payer.last_name}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Matric Number</span>
            <div className="text-white">{payer.matric_number}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Email</span>
            <div className="text-white">{payer.email}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Phone Number</span>
            <div className="text-white">{payer.phone_number}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Faculty</span>
            <div className="text-white">{payer.faculty}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Department</span>
            <div className="text-white">{payer.department}</div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Level</span>
            <div className="text-white">{payer.level || "N/A"}</div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            className="px-6 py-2 mr-1 cursor-pointer rounded bg-blue-400 text-white font-semibold hover:bg-blue-500"
            onClick={() => onViewTransactions(payer)}
          >
            View Transactions
          </button>
          <button
            className="px-6 py-2 rounded bg-purple-600 cursor-pointer text-white font-semibold hover:bg-purple-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}