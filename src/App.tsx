import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignUp } from './components/SignUp';
import { Chat } from './components/Chat';
import UserProvider, { useUser } from './context/UserContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <div>
      <h1 className="header">SecureChat.crypto</h1>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
}

export default App;
