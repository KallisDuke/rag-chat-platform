import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/Chat/ChatPage";

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<ProtectedRoute element={<ChatPage />} />} />
    </Routes>
  );
}
