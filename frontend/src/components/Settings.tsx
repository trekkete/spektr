import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from './Navbar';
import './Settings.css';

const Settings: React.FC = () => {
  const { standardParams, addStandardParam, removeStandardParam, updateStandardParams } = useSettings();
  const [newParam, setNewParam] = useState('');

  const handleAddParam = () => {
    if (newParam.trim()) {
      addStandardParam(newParam.trim());
      setNewParam('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddParam();
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset to default parameters? This will remove any custom parameters you added.')) {
      const defaults = [
        'client_ip',
        'client_mac',
        'ap_mac',
        'ssid',
        'nas_id',
        'redirect_url',
        'original_url',
        'user_agent',
        'session_id',
      ];
      updateStandardParams(defaults);
    }
  };

  return (
    <>
      <Navbar />
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
          <p className="settings-subtitle">Manage standard parameter names for query string mapping</p>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Standard Parameters</h3>
            <p className="help-text">
              These parameters are used when mapping query string parameters from vendor configurations.
              Add or remove standard parameters that will appear in the "Mapped To" dropdown.
            </p>

            <div className="add-param-section">
              <input
                type="text"
                value={newParam}
                onChange={(e) => setNewParam(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter new parameter name (e.g., user_id)"
                className="param-input"
              />
              <button
                onClick={handleAddParam}
                disabled={!newParam.trim()}
                className="btn-add"
              >
                Add Parameter
              </button>
              <button
                onClick={handleResetToDefaults}
                className="btn-reset"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="params-list">
              {standardParams.length > 0 ? (
                <table className="settings-params-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Parameter Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardParams.map((param, index) => (
                      <tr key={param}>
                        <td className="param-index">{index + 1}</td>
                        <td className="param-name">{param}</td>
                        <td>
                          <button
                            onClick={() => removeStandardParam(param)}
                            className="btn-remove"
                            title="Remove parameter"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-params">No standard parameters defined. Add some above.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
