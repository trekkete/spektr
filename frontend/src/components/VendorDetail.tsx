import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vendorService } from '../services/vendorService';
import { VendorConfiguration } from '../types/vendor';
import Navbar from './Navbar';
import './VendorDetail.css';

const VendorDetail: React.FC = () => {
  const { vendorName } = useParams<{ vendorName: string }>();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<VendorConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<VendorConfiguration | null>(null);

  useEffect(() => {
    if (vendorName) {
      fetchVersionHistory();
    }
  }, [vendorName]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const history = await vendorService.getVersionHistory(vendorName!);
      setVersions(history);
      if (history.length > 0) {
        setSelectedVersion(history[0]); // Select latest version
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleExportPDF = async (version: VendorConfiguration) => {
    try {
      const blob = await vendorService.exportToPdf(version.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${version.vendorName.replace(/[^a-zA-Z0-9]/g, '_')}_v${version.version}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleExportJSON = (version: VendorConfiguration) => {
    const dataStr = JSON.stringify(version, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${version.vendorName}_v${version.version}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = () => {
    // Just navigate to new revision page where user can import
    navigate(`/vendors/new?vendorName=${encodeURIComponent(vendorName!)}`);
  };

  const handleNewRevision = () => {
    navigate(`/vendors/new?vendorName=${encodeURIComponent(vendorName!)}`);
  };

  const handleBack = () => {
    navigate('/vendors');
  };

  const renderVendorData = (config: VendorConfiguration) => {
    const vendorData = config.vendorData;
    if (!vendorData.revisions) {
      return <p>No data available</p>;
    }

    const firstKey = Object.keys(vendorData.revisions)[0];
    const snapshot = vendorData.revisions[firstKey];

    const decodeWalledGardenMask = (mask: number): string => {
      const options = [];
      if (mask & 1) options.push('BY_IP');
      if (mask & 2) options.push('BY_DOMAIN');
      if (mask & 4) options.push('WITH_WILDCARD');
      if (mask & 8) options.push('BY_PROTOCOL');
      if (mask & 16) options.push('BY_PORT');
      return options.length > 0 ? options.join(', ') : 'None';
    };

    const decodeAuthenticationMask = (mask: number): string => {
      const options = [];
      if (mask & 1) options.push('PAP');
      if (mask & 2) options.push('CHAP');
      if (mask & 4) options.push('MS-CHAP v2');
      return options.length > 0 ? options.join(', ') : 'None';
    };

    const decodeSupportedAttributesMask = (mask: number): string => {
      const options = [];
      if (mask & 1) options.push('Session-Timeout');
      if (mask & 2) options.push('Idle-Timeout');
      if (mask & 4) options.push('Acct-Interim-Interval');
      if (mask & 8) options.push('Filter-Id');
      if (mask & 16) options.push('Upload BW Limit');
      if (mask & 32) options.push('Download BW Limit');
      if (mask & 64) options.push('Termination-Cause');
      return options.length > 0 ? options.join(', ') : 'None';
    };

    const renderField = (label: string, value: any) => {
      if (value === null || value === undefined || value === '') return null;
      return (
        <div className="field-item">
          <label>{label}:</label>
          <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
        </div>
      );
    };

    const renderMonospaceField = (label: string, value: any) => {
      if (value === null || value === undefined || value === '') return null;
      const displayValue = typeof value === 'string' ? value : String(value);
      return (
        <div className="field-item full-width">
          <label>{label}:</label>
          <span className="monospace-field">
            {displayValue.split('\n').map((line, idx, arr) => (
              <React.Fragment key={idx}>
                {line}
                {idx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        </div>
      );
    };

    const renderMap = (data: { [key: string]: string } | undefined, title: string) => {
      if (!data || Object.keys(data).length === 0) return null;
      return (
        <div className="map-section">
          <h5>{title}</h5>
          <table className="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const renderParameterTable = (params: { [key: string]: string } | undefined, mapping?: { [key: string]: string }) => {
      if (!params || Object.keys(params).length === 0) return null;
      return (
        <div className="map-section">
          <h5>Query String Parameters</h5>
          <table className="data-table">
            <thead>
              <tr>
                <th>Parameter Name</th>
                <th>Example Value</th>
                <th>Mapped To</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(params).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                  <td>{mapping?.[key] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const renderAttachments = (attachments: any[] | undefined, sectionName: string) => {
      if (!attachments || attachments.length === 0) return null;
      return (
        <div className="attachments-section">
          <h5>Attachments</h5>
          {attachments.map((att, idx) => (
            <div key={idx} className="attachment-item">
              <span className="attachment-name">{att.filename}</span>
              <span className="attachment-size">({(att.size / 1024).toFixed(2)} KB)</span>
              {att.description && <p className="attachment-desc">{att.description}</p>}
            </div>
          ))}
        </div>
      );
    };

    return (
      <>
        {/* Basic Info Section */}
        <div className="config-section">
          <h4>Basic Information</h4>
          <div className="fields-grid">
            {renderField('Operator', snapshot.operator)}
            {renderField('Model', snapshot.model)}
            {renderField('Firmware Version', snapshot.firmwareVersion)}
            {renderField('Timestamp', formatDate(new Date(snapshot.timestamp).toISOString()))}
          </div>
          {renderAttachments(snapshot.attachments, 'Basic Info')}
        </div>

        {/* Captive Portal Section */}
        {snapshot.captivePortal && (
          <div className="config-section">
            <h4>Captive Portal Configuration</h4>
            <div className="fields-grid">
              {renderMonospaceField('Redirection URL', snapshot.captivePortal.redirectionUrl)}
              {renderField('Login URL', snapshot.captivePortal.loginUrl)}
              {renderField('Logout URL', snapshot.captivePortal.logoutUrl)}
              {renderField('Notes', snapshot.captivePortal.notes)}
            </div>
            {renderParameterTable(
              snapshot.captivePortal.queryStringParameters,
              snapshot.captivePortal.queryStringMapping
            )}
            {renderAttachments(snapshot.captivePortal.attachments, 'Captive Portal')}
          </div>
        )}

        {/* RADIUS Section */}
        {snapshot.radius && (
          <div className="config-section">
            <h4>RADIUS Configuration</h4>
            <div className="fields-grid">
              {renderMonospaceField('Access Request', snapshot.radius.accessRequest)}
              {renderMonospaceField('Accounting Start', snapshot.radius.accountingStart)}
              {renderMonospaceField('Accounting Update', snapshot.radius.accountingUpdate)}
              {renderMonospaceField('Accounting Stop', snapshot.radius.accountingStop)}
              {snapshot.radius.authenticationMask !== undefined && (
                <div className="field-item">
                  <label>Password Authentication Methods:</label>
                  <span>{decodeAuthenticationMask(snapshot.radius.authenticationMask)} (Mask: {snapshot.radius.authenticationMask})</span>
                </div>
              )}
              {snapshot.radius.supportedAttributesMask !== undefined && (
                <div className="field-item">
                  <label>Supported RADIUS Attributes:</label>
                  <span>{decodeSupportedAttributesMask(snapshot.radius.supportedAttributesMask)} (Mask: {snapshot.radius.supportedAttributesMask})</span>
                </div>
              )}
              {renderField('Packet Source', snapshot.radius.packetSource)}
              {renderField('Support CoA', snapshot.radius.supportCoa)}
              {renderField('Support MAC Authentication', snapshot.radius.supportMacAuthentication)}
              {renderField('Roaming Behaviour', snapshot.radius.roamingBehaviour)}
              {renderField('Notes', snapshot.radius.notes)}
            </div>
            {renderMap(snapshot.radius.authAttributes, 'Authentication Attributes')}
            {renderMap(snapshot.radius.acctAttributes, 'Accounting Attributes')}
            {renderAttachments(snapshot.radius.attachments, 'RADIUS')}
          </div>
        )}

        {/* Walled Garden Section */}
        {snapshot.walledGarden && (
          <div className="config-section">
            <h4>Walled Garden Configuration</h4>
            <div className="fields-grid">
              {snapshot.walledGarden.mask !== undefined && (
                <div className="field-item">
                  <label>Filtering Type:</label>
                  <span>{decodeWalledGardenMask(snapshot.walledGarden.mask)} (Mask: {snapshot.walledGarden.mask})</span>
                </div>
              )}
              {renderField('Has Welcome Page', snapshot.walledGarden.welcomePage)}
              {renderField('Notes', snapshot.walledGarden.notes)}
            </div>
            {renderAttachments(snapshot.walledGarden.attachments, 'Walled Garden')}
          </div>
        )}

        {/* Login Methods Section */}
        {snapshot.loginMethods && (
          <div className="config-section">
            <h4>Login Methods</h4>
            <div className="fields-grid">
              {renderField('Support HTTPS', snapshot.loginMethods.supportHttps)}
              {renderField('Support Logout', snapshot.loginMethods.supportLogout)}
              {renderField('Support Mail Surf', snapshot.loginMethods.supportMailSurf)}
              {renderField('Support SMS Surf', snapshot.loginMethods.supportSmsSurf)}
              {renderField('Support Social Login', snapshot.loginMethods.supportSocial)}
              {renderField('Notes', snapshot.loginMethods.notes)}
            </div>
            {renderAttachments(snapshot.loginMethods.attachments, 'Login Methods')}
          </div>
        )}

        {/* Raw JSON Toggle */}
        <details className="raw-json-section">
          <summary>View Raw JSON</summary>
          <pre className="json-display">
            {JSON.stringify(vendorData, null, 2)}
          </pre>
        </details>
      </>
    );
  };

  if (loading) {
    return (
      <div className="vendor-detail-container">
        <div className="loading">Loading versions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vendor-detail-container">
        <div className="error-message">{error}</div>
        <button onClick={handleBack} className="btn-secondary">
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="vendor-detail-container">
      <div className="vendor-detail-header">
        <div>
          <button onClick={handleBack} className="btn-back">
            ← Back
          </button>
          <h2>{vendorName}</h2>
          <p className="version-count">{versions.length} version(s)</p>
        </div>
        <button onClick={handleNewRevision} className="btn-primary">
          New Revision
        </button>
      </div>

      <div className="content-layout">
        <div className="versions-sidebar">
          <h3>Versions</h3>
          <div className="versions-list">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`version-item ${
                  selectedVersion?.id === version.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="version-header">
                  <span className="version-number">v{version.version}</span>
                  {version.version === versions[0].version && (
                    <span className="badge-latest">Latest</span>
                  )}
                </div>
                <div className="version-info">
                  <p className="version-date">{formatDate(version.createdAt)}</p>
                  <p className="version-owner">by {version.ownerUsername}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="version-detail">
          {selectedVersion ? (
            <>
              <div className="detail-header">
                <h3>
                  Version {selectedVersion.version}
                  {selectedVersion.version === versions[0].version && (
                    <span className="badge-latest-inline">Latest</span>
                  )}
                </h3>
                <div className="detail-actions">
                  <button
                    onClick={handleImportJSON}
                    className="btn-import"
                  >
                    Import JSON
                  </button>
                  <button
                    onClick={() => handleExportJSON(selectedVersion)}
                    className="btn-export"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExportPDF(selectedVersion)}
                    className="btn-export"
                  >
                    Export PDF
                  </button>
                </div>
              </div>

              <div className="detail-content">
                <div className="info-section">
                  <h4>Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Owner:</label>
                      <span>{selectedVersion.ownerUsername}</span>
                    </div>
                    <div className="info-item">
                      <label>Created:</label>
                      <span>{formatDate(selectedVersion.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <label>Updated:</label>
                      <span>{formatDate(selectedVersion.updatedAt)}</span>
                    </div>
                    {selectedVersion.description && (
                      <div className="info-item full-width">
                        <label>Description:</label>
                        <span>{selectedVersion.description}</span>
                      </div>
                    )}
                    {selectedVersion.sharedWithUsernames.length > 0 && (
                      <div className="info-item full-width">
                        <label>Shared with:</label>
                        <span>{selectedVersion.sharedWithUsernames.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="data-section">
                  {renderVendorData(selectedVersion)}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <p>Select a version to view details</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default VendorDetail;
