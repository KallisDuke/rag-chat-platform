import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
}

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
