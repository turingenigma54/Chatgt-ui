import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (password: string) => {
    const errors = [];
    const minLength = 8;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;

    if (password.length < minLength) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!uppercaseRegex.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!lowercaseRegex.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!numberRegex.test(password)) {
      errors.push('Password must contain a number');
    }
    if (!symbolRegex.test(password)) {
      errors.push('Password must contain a symbol');
    }
    return errors;
  };

  useEffect(() => {
    const errors = validatePassword(password);
    setPasswordErrors(errors);
  }, [password]);

  const getPasswordStrength = () => {
    const totalCriteria = 5; // Number of validation rules
    const metCriteria = totalCriteria - passwordErrors.length;
    const strength = (metCriteria / totalCriteria) * 100;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const passwordError = validatePassword(password);
    if (passwordError.length > 0) {
      setErrorMessage('Password does not meet requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/register`, {
        username,
        email,
        password,
      });
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.detail || 'Registration failed.');
      } else {
        setErrorMessage('Registration failed.');
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="password-strength">
            <div
              className="password-strength-bar"
              style={{ width: `${getPasswordStrength()}%` }}
            ></div>
          </div>
          {passwordErrors.length > 0 && (
            <ul className="password-errors">
              {passwordErrors.map((error, index) => (
                <li key={index} className="error-message">
                  {error}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label>Re-enter Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
