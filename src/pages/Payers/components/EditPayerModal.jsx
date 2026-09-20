import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { API_ENDPOINTS } from "../../../apiConfig";
import { fetchWithTimeout, handleFetchError } from "../../../utils/fetchUtils";

export default function EditPayerModal({ payer, onClose, onPayerUpdated }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    matric_number: "",
    phone_number: "",
    faculty: "",
    department: "",
    level: "",
    session: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (payer) {
      setFormData({
        first_name: payer.first_name || "",
        last_name: payer.last_name || "",
        email: payer.email || "",
        matric_number: payer.matric_number || "",
        phone_number: payer.phone_number || "",
        faculty: payer.faculty || "",
        department: payer.department || "",
        level: payer.level || "",
        session: payer.session || payer.session_id || "",
      });
    }
  }, [payer]);

  if (!payer) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetchWithTimeout(API_ENDPOINTS.GET_PAYER(payer.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Failed to update payer.");
      }

      onPayerUpdated();
    } catch (err) {
      const errorInfo = handleFetchError(err);
      setError(errorInfo.message || "Failed to update payer details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111fbe] backdrop-blur-lg">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Edit Payer Details</h2>

        {error && <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Matric Number</label>
            <input
              type="text"
              name="matric_number"
              value={formData.matric_number}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Faculty</label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Level</label>
            <input
              type="text"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              className="px-6 py-2 rounded bg-gray-700 text-white font-semibold hover:bg-gray-600"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center justify-center min-w-[100px]"
              disabled={saving}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
