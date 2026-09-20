export default function PayersTable({ 
  totalPayers,
  payers, 
  loading, 
  onViewDetails,
  onEditPayer,
  selectedPayers,
  setSelectedPayers,
  page = 1,
  pageSize = 7,
}) {
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPayers(payers.map(payer => payer.id));
    } else {
      setSelectedPayers([]);
    }
  };

  const handleSelectPayer = (payerId, checked) => {
    if (checked) {
      setSelectedPayers(prev => [...prev, payerId]);
    } else {
      setSelectedPayers(prev => prev.filter(id => id !== payerId));
    }
  };

  const isAllSelected = payers.length > 0 && selectedPayers.length === payers.length;
  const isIndeterminate = selectedPayers.length > 0 && selectedPayers.length < payers.length;

  // Skeleton row for loading state
  const SkeletonRow = ({ index }) => (
    <tr key={index} className="border-t border-gray-800">
      <td className="py-4 w-8">
        <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="py-4 w-10">
        <div className="h-4 w-6 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="py-4 pr-2">
        <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="py-4">
        <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="py-4 pr-2">
        <div className="h-4 w-44 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="py-4">
        <div className="h-4 w-28 bg-gray-700 rounded animate-pulse" />
      </td>
      <td className="py-4">
        <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
      </td>
    </tr>
  );

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Payers List</h2>
        <h2 className="text-sm font-normal text-white/40">
          {loading ? (
            <span className="inline-block h-4 w-20 bg-gray-700 rounded animate-pulse align-middle" />
          ) : (
            `${totalPayers || 0} students`
          )}
        </h2>
        {selectedPayers.length > 0 && (
          <span className="text-sm text-gray-400">
            {selectedPayers.length} selected
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto hide-scrollbar w-full">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="py-2 w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="accent-purple-600"
                />
              </th>
              <th className="py-2 w-10 text-gray-500">S/N</th>
              <th className="py-2 w-[10rem]">NAME</th>
              <th className="py-2 w-[10rem]">MATRIC NUMBER</th>
              <th className="py-2 w-[15rem]">EMAIL</th>
              <th className="py-2 w-[10rem]">PHONE NUMBER</th>
              <th className="py-2 w-[10rem]">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} index={i} />)
            ) : payers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-6">No payers found.</td>
              </tr>
            ) : (
              payers.map((payer, idx) => {
                const serialNumber = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={payer.id || idx} className="border-t border-gray-800">
                    <td className="py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedPayers.includes(payer.id)}
                        onChange={(e) => handleSelectPayer(payer.id, e.target.checked)}
                        className="accent-purple-600"
                      />
                    </td>
                    <td className="py-4 w-10 text-gray-500 text-sm">{serialNumber}</td>
                    <td className="py-4 pr-2 text-white font-medium">
                      {payer.first_name} {payer.last_name}
                    </td>
                    <td className="py-4 text-white">{payer.matric_number}</td>
                    <td className="py-4 pr-2 text-white">{payer.email}</td>
                    <td className="py-4 text-white">{payer.phone_number}</td>
                    <td className="py-4 flex gap-3">
                      <button
                        className="text-blue-500 hover:underline cursor-pointer font-semibold text-sm"
                        onClick={() => onEditPayer && onEditPayer(payer)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-purple-600 hover:underline cursor-pointer font-semibold text-sm"
                        onClick={() => onViewDetails(payer)}
                      >
                        View Details
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
  );
}