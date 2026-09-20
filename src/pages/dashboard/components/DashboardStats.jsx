import { CheckCircle, Clock, DollarSign } from "lucide-react";

export default function DashboardStats({ meta, loading }) {
  const stats = [
    {
      label: "Total Collections",
      amount: loading ? "..." : `₦${meta?.total_collections?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.total_transactions ?? "0",
      percentage: loading ? "" : meta?.percent_collections || "",
      icon: <DollarSign className="text-purple-400" />,
      infoColor: "text-green-400",
      tooltip: "All initiated transactions, regardless of status."
    },
    {
      label: "Verified Payments",
      amount: loading ? "..." : `₦${meta?.completed_amount?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.completed_payments ?? "0",
      percentage: loading ? "" : meta?.percent_completed || "",
      icon: <CheckCircle className="text-purple-400" />,
      infoColor: "text-green-400",
      tooltip: "Payments successfully completed and verified by the gateway."
    },
    {
      label: "Pending Payments",
      amount: loading ? "..." : `₦${meta?.pending_amount?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.pending_payments ?? "0",
      percentage: loading ? "" : meta?.percent_pending || "",
      icon: <Clock className="text-yellow-400" />,
      infoColor: "text-yellow-400",
      tooltip: "Recent payments pending verification. Will eventually expire if not paid."
    },
    {
      label: "Expired Payments",
      amount: loading ? "..." : `₦${meta?.expired_amount?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.expired_payments ?? "0",
      percentage: loading ? "" : meta?.percent_expired || "",
      icon: <Clock className="text-red-400" />,
      infoColor: "text-red-400",
      tooltip: "Old unverified payments that have timed out and been cancelled."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-gray-900 rounded-xl p-5 flex flex-col gap-3 shadow relative overflow-visible">
          <div className="flex items-center gap-2">
            {stat.icon}
            <div className="group relative flex items-center gap-1 cursor-help">
              <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
              <div className="w-3.5 h-3.5 rounded-full border border-gray-500 flex items-center justify-center text-[9px] text-gray-500">
                i
              </div>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-xs text-gray-200 rounded shadow-xl border border-gray-700 z-50">
                {stat.tooltip}
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold text-white">{stat.amount}</div>
            {stat.percentage && stat.percentage !== "-" && (
              <div className={`text-xs font-bold ${stat.infoColor}`}>
                {stat.percentage}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-xs">Total Count:</span>
            <span className="text-gray-300 text-xs font-semibold">{stat.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}