import axios from "axios";

function isLocalhost(): boolean {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

const jwtBaseURL = isLocalhost() ? "http://localhost:3000" : ((import.meta.env.VITE_JWT_BASE_URL as string | undefined) ?? "");

const jwtAxios = axios.create({
  baseURL: jwtBaseURL,
  timeout: 60000,
  withCredentials: true,
});

// JWT 서버(pp.js)는 일부 API에서 이 헤더를 요구함
jwtAxios.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers["X-Requested-With"] = "XMLHttpRequest";

  const token = sessionStorage.getItem("accessToken");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default jwtAxios;
