
const API_URL = 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export class RealApi {
  
  private async fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 5000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal  
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
      try {
          const res = await this.fetchWithTimeout(`${API_URL}${endpoint}`, {
              headers: { 'Content-Type': 'application/json' },
              ...options
          });

          if (!res.ok) {
              // Try to parse error message from JSON, fallback to status text
              let errorMessage = res.statusText;
              try {
                  const errorBody = await res.json();
                  if (errorBody.message) errorMessage = errorBody.message;
              } catch (e) {}
              
              throw new ApiError(errorMessage, res.status);
          }

          // Handle empty responses (like 204 No Content)
          if (res.status === 204) return null;
          
          return res.json();
      } catch (error: any) {
          // Re-throw ApiError, wrap others (network errors)
          if (error instanceof ApiError) throw error;
          throw new Error(error.message || 'Network Error');
      }
  }

  public async get(endpoint: string) {
      return this.request(endpoint, { method: 'GET' });
  }

  public async post(endpoint: string, data: any) {
      return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  public async put(endpoint: string, data: any) {
      return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  public async delete(endpoint: string) {
      return this.request(endpoint, { method: 'DELETE' });
  }
}

export const realApi = new RealApi();
