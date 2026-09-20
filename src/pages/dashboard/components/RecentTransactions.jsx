export default function RecentTransactions({ transactions = [], loading }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
      <div className="hide-scrollbar overflow-x-auto w-full">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="py-2 min-w-[12rem]">Payer/Reference</th>
              <th className="py-2 min-w-[12rem]">Items</th>
              <th className="py-2 min-w-[8rem]">Amount</th>
              <th className="py-2 min-w-[8rem]">Status</th>
              <th className="py-2 min-w-[10rem]">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">Loading...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-6">No transactions found.</td>
              </tr>
            ) : (
              transactions.slice(0, 10).map((tx, idx) => (
                <tr key={tx.id || idx} className="border-t border-gray-800">
                  <td className="py-2">
                    <div className="font-medium text-white">
                      <span>{tx.payer_name}</span>
                      <br />
                      <span className="text-gray-400 font-light text-sm">{tx.reference_id}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-white">
                    {tx.payment_item_titles?.join(", ")}
                  </td>
                  <td className="py-2 text-white">₦{Number(tx.amount_paid).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tx.is_verified
                        ? "bg-green-800 text-green-300"
                        : tx.is_expired
                        ? "bg-red-800 text-red-300"
                        : "bg-yellow-800 text-yellow-300"
                    }`}>
                      {tx.is_verified ? "Verified" : tx.is_expired ? "Expired" : "Pending"}
                    </span>
                  </td>
                  <td className="py-2 text-gray-300">
                    <div>
                      {new Date(tx.submitted_at).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-400">
                        {new Date(tx.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}