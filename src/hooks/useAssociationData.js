import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../apiConfig';
import { fetchWithTimeout } from '../utils/fetchUtils';

export function useAssociationData() {
  const [associationData, setAssociationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWithTimeout(API_ENDPOINTS.GET_SINGLE_ASSOCIATION);
        const responseBody = await response.json();
        
        if (!response.ok) throw new Error(responseBody.error || 'Failed to fetch association data');
        
        setAssociationData(responseBody.data || responseBody);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const themeColor = associationData?.theme_color || '#9810fa';

  return { associationData, themeColor, loading, error };
}
