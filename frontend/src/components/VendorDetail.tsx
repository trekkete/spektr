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

  const handleExportPDF = (version: VendorConfiguration) => {
    // TODO: Implement PDF export
    alert(`Export PDF for ${version.vendorName} v${version.version} - Coming soon!`);
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
                  <h4>Vendor Data</h4>
                  <pre className="json-display">
                    {JSON.stringify(selectedVersion.vendorData, null, 2)}
                  </pre>
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
