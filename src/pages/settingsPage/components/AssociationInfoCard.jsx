import { useState, useEffect } from "react";
import { Edit, Copy } from "lucide-react";
import { API_ENDPOINTS } from "../../../apiConfig";
import StatusMessage from "../../../components/StatusMessage";
import SETTINGS from "../../../settings";
import { fetchWithTimeout, handleFetchError } from "../../../utils/fetchUtils";
import { triggerContextRefresh } from "../../../utils/refreshContext"; // Add this import
import SettingsCardSkeleton from "./SettingsCardSkeleton";

export default function AssociationInfoCard({ data, loading, onUpdated }) {
  const assoc = data?.results?.[0] || null;
  const domain = SETTINGS.BASE_DOMAIN;

  const initialForm = assoc
    ? {
      id: assoc.id,
      association_name: assoc.association_name || "",
      association_short_name: assoc.association_short_name || "",
      association_type: assoc.association_type || "",
      theme_color: assoc.theme_color || "#9810fa",
    }
    : {};

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setForm(initialForm);
    setLogoFile(null);
  }, [data]);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file.' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB.' });
        return;
      }

      setLogoFile(file);
      setMessage({ type: '', text: '' }); // Clear any previous errors
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Validate required fields
    if (!form.association_name.trim()) {
      setMessage({ type: 'error', text: 'Association name is required.' });
      setSaving(false);
      return;
    }

    if (!form.association_short_name.trim()) {
      setMessage({ type: 'error', text: 'Short name is required.' });
      setSaving(false);
      return;
    }

    if (!form.association_type) {
      setMessage({ type: 'error', text: 'Association type is required.' });
      setSaving(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    const method = assoc && assoc.id ? "PATCH" : "POST";
    const url = assoc && assoc.id
      ? API_ENDPOINTS.UPDATE_ASSOCIATION(assoc.id)
      : API_ENDPOINTS.CREATE_ASSOCIATION;

    try {
      let requestOptions;

      if (logoFile) {
        // Use FormData for file upload - USE NATIVE FETCH, NOT THE WRAPPER
        const formData = new FormData();
        formData.append("association_name", form.association_name);
        formData.append("association_short_name", form.association_short_name);
        formData.append("association_type", form.association_type);
        formData.append("theme_color", form.theme_color);
        formData.append("logo", logoFile);

        requestOptions = {
          method,
          headers: {
            Authorization: `Bearer ${token}`
            // Don't set Content-Type for FormData
          },
          body: formData,
        };

        // Use native fetch for FormData uploads
        const res = await fetchWithTimeout(url, requestOptions);

        const responseData = await res.json();
        if (res.ok) {
          const updated = responseData.data;
          setMessage({ type: 'success', text: 'Association info updated successfully!' });
          setSaving(false);
          setEdit(false);
          setLogoFile(null);
          onUpdated({ results: [updated] });

          // 🔥 ADD THIS LINE - Trigger context refresh
          await triggerContextRefresh();

        } else {
          const error = await res.json();
          console.error('API Error:', error);
          setMessage({
            type: 'error',
            text: error.message || error.detail || 'Failed to update association info.'
          });
        }
      } else {
        // Use the wrapper for JSON-only updates (no files)
        requestOptions = {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            association_name: form.association_name,
            association_short_name: form.association_short_name,
            association_type: form.association_type,
            theme_color: form.theme_color,
          }),
        };

        const res = await fetchWithTimeout(url, requestOptions, 30000);

        if (res.ok) {
          const responseData = await res.json();
          const updated = responseData.data;
          setMessage({ type: 'success', text: 'Association info updated successfully!' });
          setSaving(false);
          setEdit(false);
          setLogoFile(null);
          onUpdated({ results: [updated] });
        } else {
          const error = await res.json();
          console.error('API Error:', error);
          setMessage({
            type: 'error',
            text: error.message || error.detail || 'Failed to update association info.'
          });
        }
      }
    } catch (error) {
      console.error('Request Error:', error);
      const errorInfo = handleFetchError(error);
      setMessage({ type: 'error', text: errorInfo.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/pay`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage({ type: 'success', text: 'Payment link copied to clipboard!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to copy link' });
    }
  };

  if (loading && !assoc) return <SettingsCardSkeleton />;

  // Use logoFile for preview if uploading, else use logo_url from backend
  const logoUrl = logoFile
    ? URL.createObjectURL(logoFile)
    : assoc?.logo_url || null;

  return (
    <div className="bg-gray-900 rounded-xl p-6 min-h-[260px] min-w-auto relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">
            <i className="fa fa-building" />
          </span>
          Association Info
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

      {message.text && (
        <StatusMessage type={message.type}>
          {message.text}
        </StatusMessage>
      )}

      {edit ? (
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-sm">Logo</label>
            <div className="flex items-center gap-3 mt-1">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo Preview"
                  className="w-12 h-12 rounded bg-[#23263A] object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Theme Color</label>
            <div className="flex items-center gap-3 mt-1">
              <div className="relative flex-1">
                <input
                  type="color"
                  value={form.theme_color || "#9810fa"}
                  onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                  className="w-full h-12 bg-[#23263A] border border-gray-600 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border border-gray-600 shadow-lg"
                  style={{ backgroundColor: form.theme_color || "#9810fa" }}
                ></div>
                <input
                  type="text"
                  value={form.theme_color || "#9810fa"}
                  onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                  className="w-24 px-3 py-3 bg-[#23263A] border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Association Name</label>
            <input
              className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
              value={form.association_name || ""}
              onChange={e => setForm(f => ({ ...f, association_name: e.target.value }))}
              placeholder="Enter association name"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Short Name</label>
            <input
              className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
              value={form.association_short_name || ""}
              onChange={e => setForm(f => ({ ...f, association_short_name: e.target.value }))}
              placeholder="Enter short name"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Association Type</label>
            <select
              className="w-full bg-[#23263A] text-white rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-600"
              value={form.association_type || ""}
              onChange={e => setForm(f => ({ ...f, association_type: e.target.value }))}
            >
              <option value="">Select Type</option>
              <option value="hall">Hall</option>
              <option value="department">Department</option>
              <option value="faculty">Faculty</option>
              <option value="other">Other</option>
            </select>
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
                setLogoFile(null);
                setForm(initialForm);
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
            <span className="text-gray-400 text-sm w-24">Logo:</span>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded bg-[#23263A] object-cover ml-2"
              />
            ) : (
              <span className="ml-2 text-white">—</span>
            )}
          </div>

          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Theme Color:</span>
            <div className="flex items-center gap-2 ml-2">
              <div
                className="w-6 h-6 rounded border border-gray-600"
                style={{ backgroundColor: assoc?.theme_color || '#9810fa' }}
              ></div>
              <span className="text-white">{assoc?.theme_color || '#9810fa'}</span>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Association:</span>
            <span className="ml-2 text-white">{assoc?.association_name || "—"}</span>
          </div>

          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Short Name:</span>
            <span className="ml-2 text-white">{assoc?.association_short_name || "—"}</span>
          </div>

          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Type:</span>
            <span className="ml-2 text-white">{assoc?.association_type || "—"}</span>
          </div>

          <div className="flex items-center">
            <span className="text-gray-400 text-sm w-24">Payment Link:</span>
            <div className="ml-2 flex items-center gap-2 flex-1">
              {assoc?.association_short_name ? (
                <>
                  <a
                    href={`${window.location.origin}/pay`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 break-all text-sm"
                  >
                    {`${window.location.origin}/pay`}
                  </a>
                  <button
                    className="text-gray-400 hover:text-purple-400 transition-colors p-1"
                    title="Copy payment link"
                    onClick={handleCopyLink}
                  >
                    <Copy size={16} />
                  </button>
                </>
              ) : (
                <span className="text-white">—</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}