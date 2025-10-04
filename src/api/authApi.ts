import axiosInstance from "./axiosInstance";

export const login = (email: string, password: string) => {
  return axiosInstance.post("/Auth/login", { email, password }, { useApiPrefix: true });
};

export const getPublicKey = () => {
  return axiosInstance.get("/Auth/public-key", { useApiPrefix: true });
};

export const forgotPasswordLink = (email: string) => {
  return axiosInstance.post("/Account/forgotpassword", { email });
};

export const resetPassword = (email: string, token: string, newPassword: string) => {
  return axiosInstance.post("/Account/resetpassword", { email, token, newPassword });
};


