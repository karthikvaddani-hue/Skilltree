import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Only redirect to login if we had a token and got a 401 (token expired)
    // Don't redirect if we're on the landing, login, or register pages
    if (err.response?.status === 401) {
      const hadToken = !!localStorage.getItem("token");
      localStorage.removeItem("token");
      const currentPath = window.location.pathname;
      const publicPaths = ["/", "/login", "/register"];
      if (hadToken && !publicPaths.includes(currentPath)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
