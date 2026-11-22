import { API_URL } from '../config/api';
import { storage } from './storage';

class ApiService {
  async request(endpoint, options = {}) {
    const token = await storage.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  async register(name, email, password, passwordConfirmation) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
  }

  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/logout', { method: 'POST' });
  }

  async getUser() {
    return this.request('/user');
  }

  // Category endpoints
  async getCategories() {
    return this.request('/categories');
  }

  // Item endpoints
  async getItems(keyword = '', categoryId = '') {
    let endpoint = '/items';
    const params = new URLSearchParams();
    
    if (keyword) params.append('keyword', keyword);
    if (categoryId) params.append('category_id', categoryId);
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;
    
    return this.request(endpoint);
  }

  async getItem(id) {
    return this.request(`/items/${id}`);
  }

  async createItem(formData) {
    return this.request('/items', {
      method: 'POST',
      body: formData,
    });
  }

  async updateItem(id, formData) {
    return this.request(`/items/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteItem(id) {
    return this.request(`/items/${id}`, { method: 'DELETE' });
  }

  async getMyItems() {
    return this.request('/my-items');
  }

  // Borrow request endpoints
  async createBorrowRequest(itemListingId, startDate, endDate, notes = '') {
    return this.request('/borrow-requests', {
      method: 'POST',
      body: JSON.stringify({
        item_listing_id: itemListingId,
        start_date: startDate,
        end_date: endDate,
        notes,
      }),
    });
  }

  async getReceivedRequests(status = '') {
    let endpoint = '/borrow-requests/received';
    if (status) endpoint += `?status=${status}`;
    return this.request(endpoint);
  }

  async getSentRequests(status = '') {
    let endpoint = '/borrow-requests/sent';
    if (status) endpoint += `?status=${status}`;
    return this.request(endpoint);
  }

  async acceptRequest(id) {
    return this.request(`/borrow-requests/${id}/accept`, { method: 'PUT' });
  }

  async rejectRequest(id) {
    return this.request(`/borrow-requests/${id}/reject`, { method: 'PUT' });
  }
}

export const api = new ApiService();
