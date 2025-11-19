import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types/auth';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.id && response.username && response.email) {
          // Redirect authenticated users to vendors page
          navigate('/vendors');
        } else {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h1>Spektr</h1>
          <div className="nav-actions">
            <span className="user-info">Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="welcome-section">
          <h2>Welcome to Spektr</h2>
          <p>Captive Portal Vendor Configuration Management System</p>
        </div>

        <div className="info-card">
          <h3>Your Profile</h3>
          <div className="profile-info">
            <p>
              <strong>Username:</strong> {user?.username}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
          </div>
        </div>

        <div className="info-card">
          <h3>Getting Started</h3>
          <p>
            Use Spektr to manage captive portal vendor configurations. You can
            create, version, and share configurations with other users.
          </p>
          <ul>
            <li>Add new vendor configurations</li>
            <li>Upload captive portal information</li>
            <li>Export configurations as PDF</li>
            <li>Version control for all changes</li>
            <li>Share configurations with team members</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Home;
