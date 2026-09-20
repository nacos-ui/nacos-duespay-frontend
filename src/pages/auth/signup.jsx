import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';  
import { API_ENDPOINTS } from '../../apiConfig';
import StatusMessage from '../../components/StatusMessage';
import SubmitButton from '../../components/SubmitButton';
import { usePageTitle } from '../../hooks/usePageTitle';
import { fetchWithTimeout, handleFetchError } from '../../utils/fetchUtils';
import AnimatedInput from './animatedInput';

const signupURL = API_ENDPOINTS.SIGNUP;

const SignupForm = ({ onToggle }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // For normal signup
  const [googleLoading, setGoogleLoading] = useState(false); // For Google signup
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  usePageTitle("Sign Up - DuesPay");
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });

  // Google signup handler with separate loading state
  const handleGoogleSignup = async (credentialResponse) => {
    const id_token = credentialResponse.credential;
    setGoogleLoading(true);
    setError('');
    setSuccess(false);
    setFieldErrors({});
    
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.GOOGLE_AUTH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token })
      }, 20000);
      
      const responseData = await response.json();
      const data = responseData.data;
      
      if (response.ok) {
        if (data.access) localStorage.setItem('access_token', data.access);

        setSuccess(true);
        setTimeout(() => {
          // Redirect directly to dashboard (single-association system)
          navigate('/dashboard/overview');
        }, 1500);
      } else {
        setError(responseData?.message || 'Google signup failed.');
      }
    } catch (err) {
      console.error('Google signup error:', err);
      const errorInfo = handleFetchError(err);
      
      let errorMessage = 'Unable to sign up with Google. Please try again.';
      
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
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithTimeout(signupURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          password: formData.password
        })
      }, 20000);

      const responseData = await response.json();
      const data = responseData.data;
      
      if (response.ok) {
        // Don't store tokens - let user login manually
        // if (data.access) localStorage.setItem('access_token', data.access);

        setSuccess(true);
        
        // Show success message briefly, then show redirect component
        setTimeout(() => {
          setSuccess(false);
          setShowRedirectMessage(true);
          
          // After showing redirect message, switch to login
          setTimeout(() => {
            onToggle(); // Switch to login form
          }, 3000); // Show redirect message for 3 seconds
        }, 2000); // Show success message for 2 seconds
        
      } else {
        if (data?.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(responseData?.message || 'Signup failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorInfo = handleFetchError(err);
      
      let errorMessage = 'An error occurred. Please try again.';
      
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
      setLoading(false);
    }
  };

  // Check if any loading state is active
  const isAnyLoading = loading || googleLoading;

  // Show redirect component after successful signup
  if (showRedirectMessage) {
    return (
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Created Successfully!</h2>
            <p className="text-gray-400">
              Welcome to DuesPay! Your account has been created.
            </p>
          </div>
        </div>
        
        <div className="bg-[#101828] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-center space-x-2 text-purple-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Redirecting to login...</span>
          </div>
          <div className="mt-4">
            <p className="text-gray-400 text-sm">
              Please sign in with your credentials to access your dashboard
            </p>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          className="flex items-center justify-center space-x-2 mx-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 text-white">Create Account</h2>
        <p className="text-gray-400">Join DuesPay and start managing your association payments</p>
      </div>

      <div className="space-y-4">
        {error && <StatusMessage type="error">{error}</StatusMessage>}
        {success && <StatusMessage type="success">Account created successfully!</StatusMessage>}

        <div className="grid grid-cols-2 gap-4">
          <AnimatedInput
            id="first_name"
            label="First Name"
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            disabled={isAnyLoading}
            error={fieldErrors.first_name}
            required
          />

          <AnimatedInput
            id="last_name"
            label="Last Name"
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            disabled={isAnyLoading}
            error={fieldErrors.last_name}
            required
          />
        </div>

        <AnimatedInput
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isAnyLoading}
          error={fieldErrors.email}
          required
        />

        <AnimatedInput
          id="phone_number"
          label="Phone Number"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          disabled={isAnyLoading}
          error={fieldErrors.phone_number}
          required
        />

        <AnimatedInput
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isAnyLoading}
          error={fieldErrors.password}
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

        <AnimatedInput
          id="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          disabled={isAnyLoading}
          error={fieldErrors.confirmPassword}
          required
        >
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isAnyLoading}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </AnimatedInput>

        <SubmitButton
          loading={loading}
          loadingText="Creating Account..."
          type="submit"
          disabled={isAnyLoading}
        >
          Create Account
        </SubmitButton>
      </div>

      {/* Google Signup Button with separate loading state */}
      <div className="flex flex-col items-center space-y-2">
        <div className="w-full flex items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>
        <div className="flex justify-center w-full">
          {googleLoading ? (
            <div className="flex items-center justify-center w-full max-w-xs h-[40px] bg-gray-800 rounded-full border border-gray-600">
              <Loader2 className="w-5 h-5 animate-spin text-white mr-2" />
              <span className="text-white text-sm">Signing up with Google...</span>
            </div>
          ) : (
            <div className={`${isAnyLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() => setError("Google signup failed. Please try again.")}
                theme="filled_black"
                text="signup_with"
                shape="pill"
                disabled={isAnyLoading}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center">
        <span className={`text-gray-400 ${isAnyLoading ? 'opacity-50' : ''}`}>Already have an account? </span>
        <button
          onClick={onToggle}
          disabled={isAnyLoading}
          type="button"
          className={`text-purple-400 hover:text-purple-300 font-medium transition-colors ${isAnyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Sign In
        </button>
      </div>
    </form>
  );
};

export default SignupForm;