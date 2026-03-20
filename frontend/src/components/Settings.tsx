import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Navbar from './Navbar';
import './Settings.css';

const Settings: React.FC = () => {
  const {
    standardParams,
    addStandardParam,
    removeStandardParam,
    updateStandardParams,
    welcomePagePaths,
    addWelcomePagePath,
    removeWelcomePagePath,
    updateWelcomePagePaths,
    loginParamValues,
    addLoginParamValue,
    removeLoginParamValue,
    updateLoginParamValues,
    logoutParamValues,
    addLogoutParamValue,
    removeLogoutParamValue,
    updateLogoutParamValues,
  } = useSettings();

  const [newParam, setNewParam] = useState('');
  const [newWelcomePath, setNewWelcomePath] = useState('');
  const [newLoginValue, setNewLoginValue] = useState('');
  const [newLogoutValue, setNewLogoutValue] = useState('');

  const handleAddParam = () => {
    if (newParam.trim()) {
      addStandardParam(newParam.trim());
      setNewParam('');
    }
  };

  const handleAddWelcomePath = () => {
    if (newWelcomePath.trim()) {
      addWelcomePagePath(newWelcomePath.trim());
      setNewWelcomePath('');
    }
  };

  const handleAddLoginValue = () => {
    if (newLoginValue.trim()) {
      addLoginParamValue(newLoginValue.trim());
      setNewLoginValue('');
    }
  };

  const handleAddLogoutValue = () => {
    if (newLogoutValue.trim()) {
      addLogoutParamValue(newLogoutValue.trim());
      setNewLogoutValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter') {
      handler();
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset ALL settings to defaults? This will remove any custom values you added.')) {
      const defaultParams = [
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
      updateStandardParams(defaultParams);

      const defaultWelcomePaths = [
        '/start',
        '/redirect',
        '/welcome',
        '/portal',
        '/splash',
        '/captive',
      ];
      updateWelcomePagePaths(defaultWelcomePaths);

      const defaultLoginValues = [
        'login',
        'auth',
        'authenticate',
        'signin',
      ];
      updateLoginParamValues(defaultLoginValues);

      const defaultLogoutValues = [
        'logout',
        'logoff',
        'disconnect',
        'signout',
      ];
      updateLogoutParamValues(defaultLogoutValues);
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
                onKeyPress={(e) => handleKeyPress(e, handleAddParam)}
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

          <div className="settings-section">
            <h3>Welcome Page URL Patterns</h3>
            <p className="help-text">
              Path patterns used to detect welcome page/redirection URLs when parsing nginx logs.
              URLs containing these patterns in the path will be identified as redirection URLs.
            </p>

            <div className="add-param-section">
              <input
                type="text"
                value={newWelcomePath}
                onChange={(e) => setNewWelcomePath(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddWelcomePath)}
                placeholder="Enter path pattern (e.g., /welcome)"
                className="param-input"
              />
              <button
                onClick={handleAddWelcomePath}
                disabled={!newWelcomePath.trim()}
                className="btn-add"
              >
                Add Path
              </button>
            </div>

            <div className="params-list">
              {welcomePagePaths.length > 0 ? (
                <table className="settings-params-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Path Pattern</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {welcomePagePaths.map((path, index) => (
                      <tr key={path}>
                        <td className="param-index">{index + 1}</td>
                        <td className="param-name">{path}</td>
                        <td>
                          <button
                            onClick={() => removeWelcomePagePath(path)}
                            className="btn-remove"
                            title="Remove path"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-params">No path patterns defined.</p>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h3>Login Parameter Values</h3>
            <p className="help-text">
              Query parameter values that indicate a login URL.
              When parsing nginx logs, URLs with query parameters containing these values will be identified as login URLs.
              Example: ?cmd=login, ?action=auth, ?mode=signin
            </p>

            <div className="add-param-section">
              <input
                type="text"
                value={newLoginValue}
                onChange={(e) => setNewLoginValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddLoginValue)}
                placeholder="Enter value (e.g., login)"
                className="param-input"
              />
              <button
                onClick={handleAddLoginValue}
                disabled={!newLoginValue.trim()}
                className="btn-add"
              >
                Add Value
              </button>
            </div>

            <div className="params-list">
              {loginParamValues.length > 0 ? (
                <table className="settings-params-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginParamValues.map((value, index) => (
                      <tr key={value}>
                        <td className="param-index">{index + 1}</td>
                        <td className="param-name">{value}</td>
                        <td>
                          <button
                            onClick={() => removeLoginParamValue(value)}
                            className="btn-remove"
                            title="Remove value"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-params">No login values defined.</p>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h3>Logout Parameter Values</h3>
            <p className="help-text">
              Query parameter values that indicate a logout URL.
              When parsing nginx logs, URLs with query parameters containing these values will be identified as logout URLs.
              Example: ?cmd=logout, ?action=logoff, ?mode=signout
            </p>

            <div className="add-param-section">
              <input
                type="text"
                value={newLogoutValue}
                onChange={(e) => setNewLogoutValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddLogoutValue)}
                placeholder="Enter value (e.g., logout)"
                className="param-input"
              />
              <button
                onClick={handleAddLogoutValue}
                disabled={!newLogoutValue.trim()}
                className="btn-add"
              >
                Add Value
              </button>
            </div>

            <div className="params-list">
              {logoutParamValues.length > 0 ? (
                <table className="settings-params-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logoutParamValues.map((value, index) => (
                      <tr key={value}>
                        <td className="param-index">{index + 1}</td>
                        <td className="param-name">{value}</td>
                        <td>
                          <button
                            onClick={() => removeLogoutParamValue(value)}
                            className="btn-remove"
                            title="Remove value"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-params">No logout values defined.</p>
              )}
            </div>
          </div>

          <div className="settings-actions">
            <button
              onClick={handleResetToDefaults}
              className="btn-reset-all"
            >
              Reset All Settings to Defaults
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
