import axios from "axios";
const response = await fetch("/config.json");
const config = await response.json();

export const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  // Use headers from config.json if they exist and are not empty
  // Fallback to default if no headers in config.json
  headers:
    config.headers && Object.keys(config.headers).length > 0
      ? config.headers
      : { "Content-Type": "application/json" },
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server-side errors
      switch (error.response.status) {
        case 400:
          console.error("Bad request");
          break;
        case 401:
          console.error("Unauthorized");
          break;
        case 403:
          console.error("Forbidden");
          break;
        case 404:
          console.error("Page not found");
          break;
        case 500:
          console.error("Internal server error");
          break;
        default:
          console.error("An unexpected error occurred");
      }
    } else if (error.request) {
      console.error("Network error");
    } else {
      console.error("An unexpected error occurred");
    }

    return Promise.reject(error);
  }
);
