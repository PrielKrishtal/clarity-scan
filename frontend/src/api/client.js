import axios from 'axios';


const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request interceptor to inject the JWT token
apiClient.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



apiClient.interceptors.response.use(
  (response) => response, // success — pass through untouched
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true; // prevents infinite retry loop
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        localStorage.setItem('token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(original); // retry the original failed request
      } catch {
        // Refresh token also expired — full session timeout, send to login
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;