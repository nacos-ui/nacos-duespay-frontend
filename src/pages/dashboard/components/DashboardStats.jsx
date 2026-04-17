import { CheckCircle, Clock, DollarSign } from "lucide-react";

export default function DashboardStats({ meta, loading }) {
  const stats = [
    {
      label: "Total Collections",
      amount: loading ? "..." : `₦${meta?.total_collections?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.total_transactions ?? "0",
      percentage: loading ? "" : meta?.percent_collections || "",
      icon: <DollarSign className="text-purple-400" />,
      infoColor: "text-green-400"
    },
    {
      label: "Verified Payments",
      amount: loading ? "..." : `₦${meta?.completed_amount?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.completed_payments ?? "0",
      percentage: loading ? "" : meta?.percent_completed || "",
      icon: <CheckCircle className="text-purple-400" />,
      infoColor: "text-green-400"
    },
    {
      label: "Unverified Payments",
      amount: loading ? "..." : `₦${meta?.pending_amount?.toLocaleString() || "0"}`,
      count: loading ? "..." : meta?.pending_payments ?? "0",
      percentage: loading ? "" : meta?.percent_pending || "",
      icon: <Clock className="text-purple-400" />,
      infoColor: "text-red-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-gray-900 rounded-xl p-6 flex flex-col gap-3 shadow">
          <div className="flex items-center gap-2">
            {stat.icon}
            <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white">{stat.amount}</div>
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