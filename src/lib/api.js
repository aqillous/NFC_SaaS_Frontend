import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const TOKEN_STORAGE_KEY = "tapline_admin_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      if (
        window.location.pathname !== "/login" &&
        !window.location.pathname.startsWith("/r/")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// --------------------------------------------------------------------------
// AUTH
// --------------------------------------------------------------------------

export const login = (email, password) =>
  api.post("/api/auth/login", {
    email,
    password,
  });

export const getMe = () => api.get("/api/auth/me");

// --------------------------------------------------------------------------
// ADMIN DASHBOARD
// --------------------------------------------------------------------------

export const getDashboardStats = () => api.get("/api/dashboard/stats");

// --------------------------------------------------------------------------
// PUBLIC REVIEW
// --------------------------------------------------------------------------

export const getPublicReview = (slug) =>
  api.get(`/r/${encodeURIComponent(slug)}`);

export const submitFeedback = (slug, payload) =>
  api.post(`/r/${encodeURIComponent(slug)}/feedback`, payload);

// --------------------------------------------------------------------------
// RESTAURANT DASHBOARD
// --------------------------------------------------------------------------

export const getRestaurantDashboard = (params = {}) =>
  api.get("/api/restaurant/dashboard", {
    params,
  });

export const listRestaurantFeedback = (params = {}) =>
  api.get("/api/restaurant/feedback", {
    params,
  });

export const listEntityFeedback = (entityId, params = {}) =>
  api.get("/api/restaurant/feedback", {
    params: {
      entity_id: entityId,
      ...params,
    },
  });

// --------------------------------------------------------------------------
// ENTITIES
// --------------------------------------------------------------------------

export const listEntities = (params = {}) =>
  api.get("/api/entities", {
    params,
  });

export const getEntity = (id) => api.get(`/api/entities/${id}`);

export const createEntity = (payload) => api.post("/api/entities", payload);

export const updateEntity = (id, payload) =>
  api.put(`/api/entities/${id}`, payload);

export const deleteEntity = (id) => api.delete(`/api/entities/${id}`);

// --------------------------------------------------------------------------
// ENTITY LOGIN ACCOUNT
// --------------------------------------------------------------------------

export const createEntityUser = (entityId, payload) =>
  api.post(`/api/entities/${entityId}/users`, payload);

// --------------------------------------------------------------------------
// USERS
// --------------------------------------------------------------------------

export const listUsers = () => api.get("/api/users");

export const resetUserPassword = (id, password) =>
  api.post(`/api/users/${id}/reset-password`, {
    password,
  });

export const updateUserStatus = (id, isActive) =>
  api.patch(`/api/users/${id}`, {
    is_active: isActive,
  });

// --------------------------------------------------------------------------
// SUBSCRIPTIONS
// --------------------------------------------------------------------------

export const listSubscriptions = (params) =>
  api.get("/api/subscriptions", {
    params,
  });

export const getSubscription = (id) => api.get(`/api/subscriptions/${id}`);

export const createSubscription = (payload) =>
  api.post("/api/subscriptions", payload);

export const updateSubscription = (id, payload) =>
  api.put(`/api/subscriptions/${id}`, payload);

export const deleteSubscription = (id) =>
  api.delete(`/api/subscriptions/${id}`);

export default api;
