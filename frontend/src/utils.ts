import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
}

export const ADMIN_EMAIL = "kallisduke@gmail.com";

export const isTokenValid = () => {
  const token = localStorage.getItem("token");

  if (!token) return false;

  try {
    const decoded = jwtDecode<JwtPayload>(token);

    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getRole = () => localStorage.getItem("role");

export const getEmail = () => localStorage.getItem("email");

export const isAdmin = () =>
  isTokenValid() && getRole() === "admin" && getEmail() === ADMIN_EMAIL;

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
};
