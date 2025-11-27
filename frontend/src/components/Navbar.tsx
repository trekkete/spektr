import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.username) {
          setUsername(response.username);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-content">
        <h1 onClick={() => navigate('/vendors')} style={{ cursor: 'pointer' }}>
          Spektr
        </h1>
        <div className="nav-actions">
          {username && <span className="user-info">Welcome, {username}!</span>}
          <button onClick={() => navigate('/settings')} className="btn-settings">
            Settings
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
