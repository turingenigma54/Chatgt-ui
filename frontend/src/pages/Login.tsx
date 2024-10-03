import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

const Login: React.FC = () => {
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new URLSearchParams();
      data.append('username', username);
      data.append('password', password);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/token`,
        data,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      localStorage.setItem('access_token', response.data.access_token);
      setToken(response.data.access_token); // Update the context
      navigate('/chat');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        alert(`Login failed: ${error.response.data.detail}`);
      } else {
        alert('Login failed');
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card style={{ width: '400px', backgroundColor: '#000', borderColor: '#00ff00' }}>
        <Card.Body>
          <h2 className="text-center mb-4" style={{ color: '#fff' }}>Login</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="username" className="mb-3">
              <Form.Label style={{ color: '#fff' }}>Username:</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group controlId="password" className="mb-3">
              <Form.Label style={{ color: '#fff' }}>Password:</Form.Label>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Form.Check
                type="checkbox"
                label="Show Password"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="mt-2"
                style={{ color: '#fff' }}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-3">
              Login
            </Button>
            <div className="text-center">
              <Link to="/register" style={{ color: '#fff' }}>Don't have an account? Register</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;