import axios from "axios";

axios.defaults.baseURL = "http://91.229.8.222/api";
axios.defaults.withCredentials = true;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token){
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
})

export default axios;
