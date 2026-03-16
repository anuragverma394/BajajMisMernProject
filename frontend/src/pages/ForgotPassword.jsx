import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../styles/Login_2.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username) {
      toast.error('Please enter your username or registered mobile.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Password reset request submitted. Please contact admin.');
      navigate('/login', { replace: true });
    }, 600);
  };

  return (
    <div className="login-wrapper">
      <Toaster position="top-center" />
      <div className="login-container">
        <div className="forms-container">
          <div className="signin-signup">
            <form className="login-form" onSubmit={handleSubmit}>
              <h2 className="login-title">Forgot Password</h2>
              <div className="input-field">
                <i className="fa fa-user"></i>
                <input
                  type="text"
                  placeholder="Username or Mobile"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <span></span>
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
              <button type="button" className="forgot-link" onClick={() => navigate('/login')}>
                Back to Login
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

export default ForgotPassword;
