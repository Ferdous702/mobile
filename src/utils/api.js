import { API_URL } from '../config/api';
import { storage } from './storage';

const REQUEST_TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const firstValidationError = (errors) => {
  if (!errors || typeof errors !== 'object') return null;
  const first = Object.values(errors)[0];
  return Array.isArray(first) ? first[0] : first || null;
};

class ApiService {
  onUnauthorized = null;

  setUnauthorizedHandler(handler) {
    this.onUnauthorized = handler;
  }

  async request(endpoint, { method = 'GET', body, headers = {} } = {}) {
    const token = await storage.getToken();
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const finalHeaders = { Accept: 'application/json', ...headers };
    if (!isFormData && body !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

    let response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: finalHeaders,
        body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller?.signal,
      });
    } catch (err) {
      const timedOut = err?.name === 'AbortError';
      throw new ApiError(
        timedOut
          ? 'The server took too long to respond. Please try again.'
          : `Can't reach the server (${API_URL}). Make sure the backend is running with "php artisan serve --host=0.0.0.0" and your phone is on the same Wi-Fi.`,
        0
      );
    } finally {
      if (timer) clearTimeout(timer);
    }

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok || data.success === false) {
      if (response.status === 401 && token && this.onUnauthorized) {
        this.onUnauthorized();
      }
      const message =
        firstValidationError(data.errors) ||
        data.message ||
        `Request failed (HTTP ${response.status})`;
      throw new ApiError(message, response.status, data.errors || null);
    }

    return data;
  }

  // Auth
  register(name, email, password, passwordConfirmation) {
    return this.request('/register', {
      method: 'POST',
      body: { name, email, password, password_confirmation: passwordConfirmation },
    });
  }

  login(email, password) {
    return this.request('/login', { method: 'POST', body: { email, password } });
  }

  logout() {
    return this.request('/logout', { method: 'POST' });
  }

  getUser() {
    return this.request('/user');
  }

  // Categories
  getCategories() {
    return this.request('/categories');
  }

  // Items
  getItems(keyword = '', categoryId = '') {
    const params = [];
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    if (categoryId) params.push(`category_id=${encodeURIComponent(categoryId)}`);
    return this.request(`/items${params.length ? `?${params.join('&')}` : ''}`);
  }

  getItem(id) {
    return this.request(`/items/${id}`);
  }

  createItem(formData) {
    return this.request('/items', { method: 'POST', body: formData });
  }

  // PHP can't parse multipart bodies on PUT, so use Laravel method spoofing.
  updateItem(id, formData) {
    formData.append('_method', 'PUT');
    return this.request(`/items/${id}`, { method: 'POST', body: formData });
  }

  deleteItem(id) {
    return this.request(`/items/${id}`, { method: 'DELETE' });
  }

  getMyItems() {
    return this.request('/my-items');
  }

  // Borrow requests
  createBorrowRequest(itemListingId, startDate, endDate, notes = '') {
    return this.request('/borrow-requests', {
      method: 'POST',
      body: { item_listing_id: itemListingId, start_date: startDate, end_date: endDate, notes },
    });
  }

  getReceivedRequests() {
    return this.request('/borrow-requests/received');
  }

  getSentRequests() {
    return this.request('/borrow-requests/sent');
  }

  acceptRequest(id) {
    return this.request(`/borrow-requests/${id}/accept`, { method: 'PUT' });
  }

  rejectRequest(id) {
    return this.request(`/borrow-requests/${id}/reject`, { method: 'PUT' });
  }

  // Admin
  getAdminUsers() {
    return this.request('/admin/users?per_page=100');
  }

  getAdminItems() {
    return this.request('/admin/items?per_page=100');
  }

  adminDeleteItem(id) {
    return this.request(`/admin/items/${id}`, { method: 'DELETE' });
  }

  adminDeleteUser(id) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();
