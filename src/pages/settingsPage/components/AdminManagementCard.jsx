import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, UserCog } from "lucide-react";
import { API_ENDPOINTS } from "../../../apiConfig";
import StatusMessage from "../../../components/StatusMessage";
import { fetchWithTimeout, handleFetchError } from "../../../utils/fetchUtils";
import { useSession } from "../../../contexts/SessionContext";

export default function AdminManagementCard() {
  const { profile } = useSession();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'admin' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null, title: '', text: '' });

  const isSuperadmin = profile?.admin?.role === "superadmin" || profile?.role === "superadmin";
  const currentUser = profile?.admin || profile;
  
  console.log("AdminManagementCard profile:", profile, "isSuperadmin:", isSuperadmin);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetchWithTimeout(API_ENDPOINTS.ASSOCIATION_ADMINS, {
        headers: { Authorization: `Bearer ${token}` }
      }, 10000);
      
      if (res.ok) {
        const data = await res.json();
        // Handle both unpaginated arrays and paginated object responses
        const adminList = Array.isArray(data) ? data : data.results || data.data || [];
        setAdmins(adminList);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!addForm.email || !addForm.password) {
      setMessage({ type: 'error', text: 'Email and password are required' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetchWithTimeout(API_ENDPOINTS.ASSOCIATION_ADMINS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(addForm),
      }, 15000);
      
      if (res.ok) {
        await fetchAdmins();
        setShowAddModal(false);
        setAddForm({ first_name: '', last_name: '', email: '', password: '', role: 'admin' });
        setMessage({ type: 'success', text: 'Admin added successfully.' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || err.detail || 'Failed to add admin.' });
      }
    } catch (error) {
      const errorInfo = handleFetchError(error);
      setMessage({ type: 'error', text: errorInfo.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const performDeleteAdmin = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetchWithTimeout(API_ENDPOINTS.MANAGE_ASSOCIATION_ADMIN(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }, 10000);
      
      if (res.ok) {
        setAdmins(admins.filter(a => a.id !== id));
        setMessage({ type: 'success', text: 'Admin removed successfully.' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to remove admin.' });
      }
    } catch (error) {
      const errorInfo = handleFetchError(error);
      setMessage({ type: 'error', text: errorInfo.message });
    }
  };

  const performPromoteAdmin = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetchWithTimeout(API_ENDPOINTS.MANAGE_ASSOCIATION_ADMIN(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'superadmin' })
      }, 10000);
      
      if (res.ok) {
        await fetchAdmins();
        setMessage({ type: 'success', text: 'Admin promoted successfully.' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to promote admin.' });
      }
    } catch (error) {
      const errorInfo = handleFetchError(error);
      setMessage({ type: 'error', text: errorInfo.message });
    }
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    setConfirmModal({ isOpen: false, type: '', id: null, title: '', text: '' });
    
    if (type === 'delete') {
      await performDeleteAdmin(id);
    } else if (type === 'promote') {
      await performPromoteAdmin(id);
    }
  };

  // Auto-clear message
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserCog className="text-purple-400" size={20} />
          Admin Management
        </h2>
        {isSuperadmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            <Plus size={16} /> Add Admin
          </button>
        )}
      </div>

      {message.text && (
        <div className="mb-4">
          <StatusMessage type={message.type}>{message.text}</StatusMessage>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 py-4 text-center">Loading admins...</div>
      ) : (
        <div className="space-y-3">
          {admins.map(admin => (
            <div key={admin.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-white font-medium">
                  {admin.first_name} {admin.last_name} 
                  {admin.id === currentUser?.id && <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">You</span>}
                </div>
                <div className="text-gray-400 text-xs">{admin.email}</div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded font-semibold ${admin.role === 'superadmin' ? 'bg-purple-900/50 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                  {admin.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                </span>
                
                {isSuperadmin && admin.id !== currentUser?.id && (
                  <div className="flex items-center gap-1">
                    {admin.role !== 'superadmin' && (
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, type: 'promote', id: admin.id, title: 'Promote to Superadmin', text: 'Are you sure you want to promote this admin to a Superadmin?' })}
                        className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" 
                        title="Promote to Superadmin"
                      >
                        <ArrowUp size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, type: 'delete', id: admin.id, title: 'Remove Admin', text: 'Are you sure you want to completely remove this admin?' })}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Remove Admin"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {admins.length === 0 && !loading && (
            <div className="text-gray-500 text-center py-4">No admins found.</div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111fbe] backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Admin</h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">First Name</label>
                  <input required className="w-full bg-[#23263A] text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none" value={addForm.first_name} onChange={e => setAddForm(f => ({...f, first_name: e.target.value}))} />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Last Name</label>
                  <input required className="w-full bg-[#23263A] text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none" value={addForm.last_name} onChange={e => setAddForm(f => ({...f, last_name: e.target.value}))} />
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email Address</label>
                <input type="email" required className="w-full bg-[#23263A] text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-1">Set Password</label>
                <input type="text" required minLength="6" placeholder="Min 6 characters, uppercase, special char" className="w-full bg-[#23263A] text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none" value={addForm.password} onChange={e => setAddForm(f => ({...f, password: e.target.value}))} />
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Role</label>
                <select className="w-full bg-[#23263A] text-white rounded px-3 py-2 focus:ring-2 focus:ring-purple-600 outline-none" value={addForm.role} onChange={e => setAddForm(f => ({...f, role: e.target.value}))}>
                  <option value="admin">Standard Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors disabled:opacity-50">
                  {isSubmitting ? "Adding..." : "Add Admin"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f111fbe] backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h3 className="text-lg font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-gray-400 mb-6">{confirmModal.text}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleConfirmAction}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors"
              >
                Confirm
              </button>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: '', id: null, title: '', text: '' })}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
