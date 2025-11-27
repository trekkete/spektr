import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vendorService } from '../services/vendorService';
import { Vendor } from '../types/vendor';
import Navbar from './Navbar';
import VendorWizard from './VendorWizard';
import './NewVendor.css';

type ViewMode = 'form' | 'json';

const NewVendor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorNameParam = searchParams.get('vendorName');

  const [vendorName, setVendorName] = useState(vendorNameParam || '');
  const [description, setDescription] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isNewVendor, setIsNewVendor] = useState(!vendorNameParam);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [hasPreviousRevision, setHasPreviousRevision] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  useEffect(() => {
    if (vendorNameParam) {
      // Pre-fill with template for existing vendor
      const template: Vendor = {
        name: vendorNameParam,
        revisionsCount: 0,
        revisions: {},
      };
      setJsonInput(JSON.stringify(template, null, 2));

      // Check if there's a previous revision available
      vendorService.getVersionHistory(vendorNameParam)
        .then((history) => {
          setHasPreviousRevision(history.length > 0);
        })
        .catch(() => {
          setHasPreviousRevision(false);
        });
    } else {
      // Blank template for new vendor
      const template: Vendor = {
        name: '',
        revisionsCount: 0,
        revisions: {},
      };
      setJsonInput(JSON.stringify(template, null, 2));
      setHasPreviousRevision(false);
    }
  }, [vendorNameParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vendorName.trim()) {
      setError('Vendor name is required');
      return;
    }

    try {
      setLoading(true);

      // Parse JSON input
      let vendorData: Vendor;
      try {
        vendorData = JSON.parse(jsonInput);
      } catch (err) {
        setError('Invalid JSON format');
        return;
      }

      // Update vendor name in data
      vendorData.name = vendorName;

      await vendorService.createVendor({
        vendorName,
        vendorData,
        description: description || undefined,
      });

      // Navigate to vendor detail
      navigate(`/vendors/${encodeURIComponent(vendorName)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (vendorNameParam) {
      navigate(`/vendors/${encodeURIComponent(vendorNameParam)}`);
    } else {
      navigate('/vendors');
    }
  };

  const handleLoadSample = () => {
    const sample: Vendor = {
      name: vendorName || 'Sample Vendor',
      revisionsCount: 1,
      revisions: {
        'rev1': {
          operator: 'admin',
          timestamp: Date.now(),
          model: 'Model-X100',
          firmwareVersion: '1.0.0',
          captivePortal: {
            redirectionUrl: 'https://portal.example.com',
            loginUrl: 'https://portal.example.com/login',
            logoutUrl: 'https://portal.example.com/logout',
            queryStringParameters: {
              'client_mac': 'MAC',
              'client_ip': 'IP',
            },
            notes: 'Sample captive portal configuration',
          },
          radius: {
            accessRequest: 'RADIUS Access-Request sample',
            accountingStart: 'RADIUS Accounting-Start sample',
            supportMacAuthentication: true,
            supportRoaming: false,
            notes: 'Sample RADIUS configuration',
          },
          walledGarden: {
            mask: 3,
            welcomePage: true,
          },
          loginMethods: {
            supportHttps: true,
            supportLogout: true,
            supportMailSurf: false,
            supportSmsSurf: false,
            supportSocial: true,
          },
        },
      },
    };
    setJsonInput(JSON.stringify(sample, null, 2));
    // Force wizard to re-render with sample data
    setWizardKey(prev => prev + 1);
  };

  const handleLoadPreviousRevision = async () => {
    if (!vendorNameParam) return;

    try {
      setLoading(true);
      setError('');

      const history = await vendorService.getVersionHistory(vendorNameParam);

      if (history.length === 0) {
        setError('No previous revisions found for this vendor');
        return;
      }

      // Get the latest revision (first in the array as history is ordered by version DESC)
      const latestRevision = history[0];
      setJsonInput(JSON.stringify(latestRevision.vendorData, null, 2));

      if (latestRevision.description) {
        setDescription(latestRevision.description);
      }

      // Force wizard to re-render with new data
      setWizardKey(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load previous revision');
      console.error('Load previous revision error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedData = JSON.parse(text);

        // Check if it's a full VendorConfiguration or just Vendor data
        if (importedData.vendorData) {
          // It's a VendorConfiguration export
          setJsonInput(JSON.stringify(importedData.vendorData, null, 2));
          if (importedData.description) {
            setDescription(importedData.description);
          }
          if (importedData.vendorName && !vendorNameParam) {
            setVendorName(importedData.vendorName);
          }
        } else {
          // It's raw Vendor data
          setJsonInput(JSON.stringify(importedData, null, 2));
        }

        // Force wizard to re-render with imported data
        setWizardKey(prev => prev + 1);
      } catch (err) {
        setError('Failed to import JSON: Invalid file format');
        console.error('Import error:', err);
      }
    };
    input.click();
  };

  return (
    <>
      <Navbar />
      <div className="new-vendor-container">
      <div className="new-vendor-header">
        <h2>{isNewVendor ? 'Create New Vendor' : `New Revision for ${vendorName}`}</h2>
      </div>

      <form onSubmit={handleSubmit} className="new-vendor-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="vendorName">Vendor Name *</label>
            <input
              type="text"
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              required
              disabled={!isNewVendor}
              placeholder="Enter vendor name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description of this configuration"
            />
          </div>
        </div>

        <div className="view-toggle-section">
          <div className="view-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'form' ? 'active' : ''}`}
              onClick={() => setViewMode('form')}
            >
              Form View
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'json' ? 'active' : ''}`}
              onClick={() => setViewMode('json')}
            >
              JSON View
            </button>
          </div>
          <div className="view-actions">
            <button
              type="button"
              onClick={handleLoadPreviousRevision}
              className="btn-load-previous"
              disabled={!hasPreviousRevision || loading}
              title={!hasPreviousRevision ? 'No previous revision available' : 'Load the most recent revision'}
            >
              Load Previous Revision
            </button>
          </div>
        </div>

        {viewMode === 'form' ? (
          <VendorWizard
            key={wizardKey}
            initialData={(() => {
              try {
                return JSON.parse(jsonInput);
              } catch {
                return {
                  name: vendorName || '',
                  revisionsCount: 0,
                  revisions: {},
                };
              }
            })()}
            onDataChange={(data) => setJsonInput(JSON.stringify(data, null, 2))}
          />
        ) : (
          <div className="form-section">
            <div className="json-header">
              <label>Vendor Configuration Data (JSON) *</label>
              <div className="json-actions">
                <button
                  type="button"
                  onClick={handleImportJSON}
                  className="btn-import-small"
                >
                  Import JSON
                </button>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="btn-sample"
                >
                  Load Sample
                </button>
              </div>
            </div>
            <textarea
              className="json-input"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={20}
              placeholder="Enter vendor data as JSON"
              required
            />
            <p className="help-text">
              Enter the vendor configuration as JSON. Use "Import JSON" to load from a file or "Load Sample" to see an example structure.
            </p>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Configuration'}
          </button>
        </div>
      </form>
      </div>
    </>
  );
};

export default NewVendor;
