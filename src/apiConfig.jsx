// export const API_BASE_URL = "http://localhost:8000";
export const API_BASE_URL = "https://duespay-backend.onrender.com";

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login/`,
  SIGNUP: `${API_BASE_URL}/api/auth/register/`,
  PASSWORD_RESET: `${API_BASE_URL}/api/auth/password-reset/`,
  PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/api/auth/password-reset-confirm/`,
  GOOGLE_AUTH: `${API_BASE_URL}/api/auth/google/`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout/`,

  // Transactions endpoints
  VERIFY_AND_CREATE_TRANSACTION: `${API_BASE_URL}/api/transactions/verify-and-create/`,
  GET_TRANSACTIONS: `${API_BASE_URL}/api/transactions/`,
  DETAIL_TRANSACTION: (id) => `${API_BASE_URL}/api/transactions/${id}/`,
  DELETE_TRANSACTION: (id) => `${API_BASE_URL}/api/transactions/${id}/`,
  VERIFY_EDIT_TRANSACTION: (id) => `${API_BASE_URL}/api/transactions/${id}/`,
  // initiate payment
  PAYMENT_INITIATE: `${API_BASE_URL}/api/transactions/payment/initiate/`,
  PAYMENT_STATUS: (reference_id) => `${API_BASE_URL}/api/transactions/payment/status/${reference_id}/`,
  GET_RECEIPT: (receipt_id) => `${API_BASE_URL}/api/transactions/receipts/${receipt_id}/`,

  // Association Endpoints
  CREATE_ASSOCIATION: `${API_BASE_URL}/api/association/profiles/`,
  UPDATE_ASSOCIATION: (id) => `${API_BASE_URL}/api/association/profiles/${id}/`,
  GET_ASSOCIATION: `${API_BASE_URL}/api/association/profiles/`,
  GET_PAYMENT_ASSOCIATION: (shortName) => `${API_BASE_URL}/api/association/get-association/${shortName?.toLowerCase()}/`,
  // New endpoint for getting the single association without shortname
  GET_SINGLE_ASSOCIATION: `${API_BASE_URL}/api/association/get-association/`,
  GET_PROFILE: `${API_BASE_URL}/api/association/get-profile/`,

  // Notifications endpoints
  NOTIFICATIONS: `${API_BASE_URL}/api/association/notifications/`,
  UNREAD_NOTIFICATIONS_COUNT: `${API_BASE_URL}/api/association/notifications/unread-count/`,
  MARK_ALL_NOTIFICATIONS_READ: `${API_BASE_URL}/api/association/notifications/mark-all-read/`,

  // Payers endpoints
  GET_PAYERS: `${API_BASE_URL}/api/payers/`,
  GET_PAYER: (id) => `${API_BASE_URL}/api/payers/${id}/`,
  PAYER_CHECK: `${API_BASE_URL}/api/payers/check/`,

  // Payment items endpoints
  PAYMENT_ITEM_DETAILS: (id) => `${API_BASE_URL}/api/payments/payment-items/${id}/`,
  PAYMENT_ITEMS: `${API_BASE_URL}/api/payments/payment-items/`,

  // Bank account endpoints
  GET_CREATE_BANK_ACCOUNT: `${API_BASE_URL}/api/payments/bank-account/`,
  UPDATE_DETAIL_BANK_ACCOUNT: (id) => `${API_BASE_URL}/api/payments/bank-account/${id}/`,
  GET_BANKS: `${API_BASE_URL}/api/payments/bank-account/all-banks/`,
  VERIFY_BANK: `${API_BASE_URL}/api/payments/bank-account/verify/`,

  // Admin profile endpoints
  GET_ADMIN_USER: `${API_BASE_URL}/api/main/adminuser/`,
  UPDATE_ADMIN_USER: (id) => `${API_BASE_URL}/api/main/adminuser/${id}/`,

  // Session endpoints
  GET_SESSIONS: `${API_BASE_URL}/api/association/sessions/`,
  CREATE_SESSION: `${API_BASE_URL}/api/association/sessions/`,
  UPDATE_SESSION: (id) => `${API_BASE_URL}/api/association/sessions/${id}/`,
  SET_CURRENT_SESSION: (id) => `${API_BASE_URL}/api/association/sessions/${id}/set_current/`,
  GET_CURRENT_SESSION: `${API_BASE_URL}/api/association/sessions/current/`,
};