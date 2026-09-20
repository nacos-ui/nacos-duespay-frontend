import { useState, useEffect } from "react";
import { Edit, Eye, EyeOff } from "lucide-react";
import { API_ENDPOINTS } from "../../../apiConfig";
import StatusMessage from "../../../components/StatusMessage";
import { fetchWithTimeout, handleFetchError } from "../../../utils/fetchUtils";
import { triggerContextRefresh } from "../../../utils/refreshContext"; // Add this import
import SettingsCardSkeleton from "./SettingsCardSkeleton";

export default function AdminProfileCard({ data, loading, onUpdated }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(data || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => setForm(data || {}), [data]);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem("access_token");
    
    // Prepare data to send
    const updateData = { ...form };
    
    // Check password fields
    if (passwordData.new_password || passwordData.confirm_password) {
      if (!passwordData.new_password) {
        setMessage({ type: 'error', text: 'Please enter a new password.' });
        setSaving(false);
        return;
      }
      if (!passwordData.confirm_password) {
        setMessage({ type: 'error', text: 'Please confirm your new password.' });
        setSaving(false);
        return;
      }
      if (passwordData.new_password !== passwordData.confirm_password) {
        setMessage({ type: 'error', text: "Passwords don't match!" });
        setSaving(false);
        return;
      }
      updateData.password = passwordData.new_password;
    }

    try {
      const res = await fetchWithTimeout(API_ENDPOINTS.GET_ADMIN_USER, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData),
      }, 20000);
      
      const responseData = await res.json();
      if (res.ok) {
        const updated = responseData.data;
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setSaving(false);
        setEdit(false);
        setPasswordData({ new_password: "", confirm_password: "" });
        onUpdated(updated);
        
        await triggerContextRefresh();
        
      } else {
        const errorData = await res.json();
        let errorMsg = 'Update failed';
        
        if (errorData.message) {
           errorMsg = errorData.message;
           // If the backend returns the generic fallback message, try to extract the specific field error
           if (errorMsg === "Please check your input and try again" && errorData.errors && Object.keys(errorData.errors).length > 0) {
              const firstKey = Object.keys(errorData.errors)[0];
              const formattedKey = firstKey.charAt(0).toUpperCase() + firstKey.slice(1).replace('_', ' ');
              errorMsg = `${formattedKey}: ${errorData.errors[firstKey]}`;
           }
        } else if (errorData.detail) {
           errorMsg = errorData.detail;
        } else if (errorData.error) {
           errorMsg = errorData.error;
        } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
           const firstKey = Object.keys(errorData)[0];
           if (Array.isArray(errorData[firstKey])) {
             const formattedKey = firstKey.charAt(0).toUpperCase() + firstKey.slice(1).replace('_', ' ');
             errorMsg = `${formattedKey}: ${errorData[firstKey][0]}`;
           } else if (typeof errorData[firstKey] === 'string') {
             errorMsg = errorData[firstKey];
           }
        }
        
        setMessage({ type: 'error', text: errorMsg });
        setSaving(false);
      }
    } catch (error) {
      const errorInfo = handleFetchError(error);
      setMessage({ type: 'error', text: errorInfo.message });
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading && !data) return <SettingsCardSkeleton />;

  return (
    <div className="bg-gray-900 rounded-xl p-6 min-h-[260px] min-w-auto flex-wrap wrap-break-word relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-purple-400"><i className="fa fa-user" /></span>
          Admin Profile
        </h2>
        {!edit && (
          <button 
            className="text-purple-400 hover:text-purple-300 transition-colors"
            onClick={() => setEdit(true)}
          >
            <Edit size={18} />
          </button>
        )}
      </div>
      
      {!edit && message.type === "success" && message.text && (
        <StatusMessage type={message.type}>
          {message.text}
        </StatusMessage>
      )}
      
      {edit ? (
        <div className="space-y-3">
          {message.type !== "success" && message.text && (
            <StatusMessage type={message.type}>
              {message.text}
            </StatusMessage>
          )}

          <div>
            <label className="text-gray-400 text-sm">Email</label>
            <input
              className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
              value={form.email || ""}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-gray-400 text-sm">First Name</label>
              <input
                className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={form.first_name || ""}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-sm">Last Name</label>
              <input
                className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={form.last_name || ""}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm">Phone Number</label>
            <input
              className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
              value={form.phone_number || ""}
              onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
            />
          </div>
          
          {/* Password Change Section */}
          <div>
            <label className="text-gray-400 text-sm">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                className="w-full bg-[#23263A] text-white rounded px-3 py-2 pr-10 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={passwordData.new_password}
                onChange={e => setPasswordData(p => ({ ...p, new_password: e.target.value }))}
                placeholder="Enter new password (optional)"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                className="w-full bg-[#23263A] text-white rounded px-3 py-2 pr-10 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
                value={passwordData.confirm_password}
                onChange={e => setPasswordData(p => ({ ...p, confirm_password: e.target.value }))}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              onClick={() => {
                setEdit(false);
                setPasswordData({ new_password: "", confirm_password: "" });
                setMessage({ type: '', text: '' });
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Email:</span>
            <span className="ml-2 text-white">{data?.email || "—"}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Full Name:</span>
            <span className="ml-2 text-white">{(data?.first_name || "—") + " " + (data?.last_name || "")}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Phone:</span>
            <span className="ml-2 text-white">{data?.phone_number || "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}