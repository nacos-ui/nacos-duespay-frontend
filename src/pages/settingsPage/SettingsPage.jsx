import { useEffect, useState } from "react";
import MainLayout from "../../layouts/mainLayout";
import BankInfoCard from "./components/BankInfoCard";
import AdminProfileCard from "./components/AdminProfileCard";
import AssociationInfoCard from "./components/AssociationInfoCard";
import SessionManagementCard from "./components/SessionManagementCard";
import { API_ENDPOINTS } from "../../apiConfig";
import { usePageTitle } from "../../hooks/usePageTitle";
import { fetchWithTimeout, handleFetchError } from "../../utils/fetchUtils";

export default function SettingsPage() {
  const [bankInfo, setBankInfo] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [association, setAssociation] = useState(null);
  const [loading, setLoading] = useState(true);

  usePageTitle("Settings - DuesPay");
  
  // Fetch all settings data
  useEffect(() => {
    const fetchSettingsData = async () => {
      const token = localStorage.getItem("access_token");
      setLoading(true);
      
      try {
        const [bankResponse, adminResponse, assocResponse] = await Promise.all([
          fetchWithTimeout(API_ENDPOINTS.GET_CREATE_BANK_ACCOUNT, { 
            headers: { Authorization: `Bearer ${token}` } 
          }, 20000), // 10 second timeout for bank info
          fetchWithTimeout(API_ENDPOINTS.GET_ADMIN_USER, { 
            headers: { Authorization: `Bearer ${token}` } 
          }, 20000), // 10 second timeout for admin data
          fetchWithTimeout(API_ENDPOINTS.GET_ASSOCIATION, { 
            headers: { Authorization: `Bearer ${token}` } 
          }, 20000), // 10 second timeout for association data
        ]);

        const [bankData, adminData, assocData] = await Promise.all([
          bankResponse.ok ? bankResponse.json() : null,
          adminResponse.ok ? adminResponse.json() : null,
          assocResponse.ok ? assocResponse.json() : null,
        ]);

        setBankInfo(bankData.data);
        setAdmin(adminData.data);
        setAssociation(assocData.data);
      } catch (error) {
        const errorInfo = handleFetchError(error);
        console.error('Failed to fetch settings data:', errorInfo.message);
        // Set default values on error
        setBankInfo(null);
        setAdmin(null);
        setAssociation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsData();
  }, []);

  return (
    <MainLayout>
      <div className="pt-16 sm:pt-16 sm:p-6 min-h-screen bg-[#0F111F]">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 mb-8">Manage your account settings and preferences</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* <BankInfoCard
            data={bankInfo}
            loading={loading}
            onUpdated={updated => setBankInfo(updated)}
          /> */}
          <AdminProfileCard
            data={admin}
            loading={loading}
            onUpdated={updated => setAdmin(updated)}
          />
          <AssociationInfoCard
            data={association}
            loading={loading}
            onUpdated={updated => setAssociation(updated)}
          />
          <SessionManagementCard />
        </div>
      </div>
    </MainLayout>
  );
}