import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Route guard: renders children only for an authenticated admin. While a stored
// token is still being validated we render nothing (avoids a login-page flash);
// otherwise unauthenticated visitors are bounced to /login.
export default function RequireAuth({ children }) {
  const { isAuthed, checking } = useAuth();
  if (checking) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
