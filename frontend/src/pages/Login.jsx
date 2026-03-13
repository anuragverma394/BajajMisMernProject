import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { authService } from '../microservices/api.service';
import '../styles/Login_2.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [season, setSeason] = useState('2526');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({ username, password, season });

      if (result.status === 'success') {
        const user = result.data?.user || null;
        localStorage.setItem('token', result.token || '');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('season', season);

        toast.success(`Welcome back, ${user?.name || user?.Name || username}!`);

        // Small delay for toast visibility
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = error.response?.data?.message || "Invalid username or password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Toaster position="top-center" />
      <div className="login-container">
        <div className="forms-container">
          <div className="signin-signup">
            <form className="login-form" onSubmit={handleLogin}>
              <h2 className="login-title">Factory Login</h2>

              <div className="input-field">
                <i className="fa fa-calendar"></i>
                <select value={season} onChange={(e) => setSeason(e.target.value)} required>
                  <option value="2021">2020-2021</option>
                  <option value="2122">2021-2022</option>
                  <option value="2223">2022-2023</option>
                  <option value="2324">2023-2024</option>
                  <option value="2425">2024-2025</option>
                  <option value="2526">2025-2026</option>
                </select>
              </div>

              <div className="input-field">
                <i className="fa fa-user"></i>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="input-field">
                <i className="fa fa-lock"></i>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          </div>
        </div>

        <div className="panels-container">
          <div className="panel left-panel">
            <img src="/assets/images/Bajaj_Sugar_page-0001-removebg-preview.png" className="image" alt="Bajaj Sugar Logo" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;




