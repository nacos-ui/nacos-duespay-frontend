import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { API_ENDPOINTS } from '../../apiConfig';
import StatusMessage from '../../components/StatusMessage';
import SubmitButton from '../../components/SubmitButton';
import { usePageTitle } from '../../hooks/usePageTitle';
import { fetchWithTimeout, handleFetchError } from '../../utils/fetchUtils';
import { useSession } from '../../contexts/SessionContext';
import AnimatedInput from './animatedInput';

const loginURL = API_ENDPOINTS.LOGIN;

const LoginForm = ({ onToggle, onForgotPassword }) => {
  const navigate = useNavigate();
  const { refreshData } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // For normal login
  const [googleLoading, setGoogleLoading] = useState(false); // For Google login
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  usePageTitle("Login - DuesPay");
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Google login handler with separate loading state
  const handleGoogleLogin = async (credentialResponse) => {
    const id_token = credentialResponse.credential;
    setGoogleLoading(true); // Use separate Google loading state
    setError('');
    setSuccess('');
    
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.GOOGLE_AUTH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token })
      }, 20000);
      
      const responseData = await response.json();
      const data = responseData.data;
      
      if (response.ok && responseData.success) {
        localStorage.clear();
        localStorage.setItem('access_token', data.access);
        
        await refreshData();
        setSuccess('Login successful!');
        setTimeout(() => {
          if (data.is_first_login) {
            navigate('/create-association');
          } else {
            navigate('/dashboard/overview');
          }
        }, 1500);
      } else {
        setError(responseData?.message || 'Google login failed.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      const errorInfo = handleFetchError(err);
      
      let errorMessage = 'Unable to sign in with Google. Please try again.';
      
      if (errorInfo && typeof errorInfo === 'object') {
        errorMessage = errorInfo.message || errorInfo.detail || errorMessage;
      } else if (typeof errorInfo === 'string') {
        errorMessage = errorInfo;
      }
      
      if (err.name === 'TypeError' || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false); // Reset Google loading state
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Normal login loading
    setError('');
    setSuccess('');
    
    try {
      const response = await fetchWithTimeout(loginURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      }, 20000);

      const responseData = await response.json();
      const data = responseData.data;

      if (response.ok) {
        console.log('Login successful, setting tokens...');
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.setItem('access_token', data.access);
        
        console.log('Tokens set, refreshing session data...');
        
        setTimeout(async () => {
          await refreshData();
          setSuccess('Login successful!');
          
          setTimeout(() => {
            if (data.is_first_login) {
              navigate('/create-association');
            } else {
              navigate('/dashboard/overview');
            }
          }, 1000);
        }, 200);
        
      } else {
        setError(responseData?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorInfo = handleFetchError(err);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (errorInfo && typeof errorInfo === 'object') {
        errorMessage = errorInfo.message || errorInfo.detail || errorMessage;
      } else if (typeof errorInfo === 'string') {
        errorMessage = errorInfo;
      }
      
      if (err.name === 'TypeError' || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false); // Reset normal login loading
    }
  };

  // Check if any loading state is active
  const isAnyLoading = loading || googleLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-white">Welcome Back</h2>
        <p className="text-gray-400">Welcome back! Please enter your details.</p>
      </div>

      <div className="space-y-4">
        {error && <StatusMessage type="error">{error}</StatusMessage>}
        {success && <StatusMessage type="success">{success}</StatusMessage>}

        <AnimatedInput
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isAnyLoading}
          required
        />

        <AnimatedInput
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isAnyLoading}
          required
        >
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isAnyLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </AnimatedInput>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              disabled={isAnyLoading}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 bg-gray-700 rounded disabled:opacity-50"
            />
            {/* <label htmlFor="remember-me" className={`ml-2 block text-sm text-gray-300 ${isAnyLoading ? 'opacity-50' : ''}`}>
              Remember me
            </label> */}
          </div>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={isAnyLoading}
            className={`text-sm text-purple-400 hover:text-purple-300 transition-colors ${isAnyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Forgot password?
          </button>
        </div>

        <SubmitButton
          loading={loading}
          loadingText="Signing In..."
          type="submit"
          disabled={isAnyLoading}
        >
          Sign In
        </SubmitButton>
      </div>

      {/* Google Login Button with separate loading state */}
      {/* <div className="flex flex-col items-center space-y-2">
        <div className="w-full flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>
        <div className="flex justify-center w-full">
          {googleLoading ? (
            <div className="flex items-center justify-center w-full max-w-xs h-[40px] bg-gray-800 rounded-full border border-gray-600">
              <Loader2 className="w-5 h-5 animate-spin text-white mr-2" />
              <span className="text-white text-sm">Signing in with Google...</span>
            </div>
          ) : (
            <div className={`${isAnyLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Google login failed. Please try again.")}
                theme="filled_black"
                text="signin_with"
                shape="pill"
                disabled={isAnyLoading}
              />
            </div>
          )}
        </div>
      </div> */}
      
      {/* <div className="text-center">
        <span className={`text-gray-400 ${isAnyLoading ? 'opacity-50' : ''}`}>Don't have an account? </span>
        <button
          onClick={onToggle}
          disabled={isAnyLoading}
          className={`text-purple-400 hover:text-purple-300 font-medium transition-colors ${isAnyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Sign Up
        </button>
      </div> */}
    </form>
  );
};

export default LoginForm;