import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Chat from './pages/Chat';

const App: React.FC = () => {
  const { token } = useContext(AuthContext);

  return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to={token ? '/chat' : '/login'} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/login"
            element={token ? <Navigate to="/chat" /> : <Login />}
          />
          <Route
            path="/chat"
            element={token ? <Chat /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
  );
};

export default App;