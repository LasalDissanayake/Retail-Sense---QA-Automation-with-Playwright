const API_CONFIG = {
  BASE_URL: 'http://localhost:3000', // The URL where your Express API is running
  ENDPOINTS: {
    INVENTORY: {
      ALL: '/api/inventory',
      PAGINATED: '/api/inventory', // Explicitly defined for pagination
      BASE: '/api/inventory', // Added for InventoryManagementAll component
      SINGLE: (id) => `/api/inventory/${id}`,
      RETRIEVED: {
        ALL: '/api/inventory/retrieved/all',
        SINGLE: (id) => `/api/inventory/retrieved/${id}`,
        toString: function() { return this.ALL; }
      },
      CREATE: '/api/inventory/create',
      UPDATE: (id) => `/api/inventory/update/${id}`,
      DELETE: (id) => `/api/inventory/delete/${id}`,
      // Default endpoint for various inventory operations
      DEFAULT: '/api/inventory',
      // Improved toString to always return a string value
      toString: function() { return this.ALL || this.DEFAULT || '/api/inventory'; }
    },
    PROMOTIONS: {
      ALL: '/api/promotions',
      PAGINATED: '/api/promotions', // Explicitly defined for pagination
      SINGLE: (id) => `/api/promotions/${id}`,
      CREATE: '/api/promotions/create',
      UPDATE: (id) => `/api/promotions/${id}`,
      DELETE: (id) => `/api/promotions/${id}`,
      DEFAULT: '/api/promotions',
      toString: function() { return this.ALL || this.DEFAULT || '/api/promotions'; }
    },
    USERS: {
      ALL: '/api/users',
      SINGLE: (id) => `/api/users/${id}`,
      CREATE: '/api/users/create',
      UPDATE: (id) => `/api/users/update/${id}`,
      DELETE: (id) => `/api/users/delete/${id}`,
      DEFAULT: '/api/users',
      toString: function() { return this.ALL || this.DEFAULT || '/api/users'; }
    },
    FEEDBACK: {
      ALL: '/api/feedbacks',
      SINGLE: (id) => `/api/feedbacks/${id}`,
      CREATE: '/api/feedbacks/create',
      DEFAULT: '/api/feedbacks',
      toString: function() { return this.ALL || this.DEFAULT || '/api/feedbacks'; }
    },
    AUTH: {
      LOGIN: '/api/auth/signin',
      REGISTER: '/api/auth/signup',
      LOGOUT: '/api/auth/signout',
      DEFAULT: '/api/auth/signin',
      toString: function() { return this.LOGIN || this.DEFAULT || '/api/auth/signin'; }
    },
    ORDERS: {
      ALL: '/api/orders',
      ADD: '/api/orders/add',
      SINGLE: (id) => `/api/orders/${id}`,
      USER: (userId) => `/api/orders/user/${userId}`,
      UPDATE: (id) => `/api/orders/${id}`,
      DEFAULT: '/api/orders',
      toString: function() { return this.ALL || this.DEFAULT || '/api/orders'; }
    }
  },
  // Helper method to safely get any endpoint, with fallbacks
  getEndpoint: function(path) {
    try {
      // Split path by dots and traverse the endpoints object
      const parts = path.split('.');
      let result = this.ENDPOINTS;
      
      for (const part of parts) {
        if (result && result[part]) {
          result = result[part];
        } else {
          // Return a default path if any part is missing
          return '/api/' + parts[0].toLowerCase();
        }
      }
      
      // Handle function endpoints
      if (typeof result === 'function') {
        return result;
      }
      
      // For objects, prefer their toString method
      if (typeof result === 'object' && result.toString !== Object.prototype.toString) {
        return result.toString();
      }
      
      return result || '/api';
    } catch (error) {
      console.error('Error getting endpoint:', error);
      return '/api';
    }
  }
};

export default API_CONFIG;