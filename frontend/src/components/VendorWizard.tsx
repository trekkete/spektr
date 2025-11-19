import React, { useState } from 'react';
import { Vendor, VendorIntegrationSnapshot } from '../types/vendor';
import './VendorWizard.css';

interface VendorWizardProps {
  initialData: Vendor;
  onDataChange: (data: Vendor) => void;
}

const VendorWizard: React.FC<VendorWizardProps> = ({ initialData, onDataChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [vendorData, setVendorData] = useState<Vendor>(initialData);

  // Initialize snapshot if doesn't exist
  const getSnapshot = (): VendorIntegrationSnapshot => {
    const firstKey = Object.keys(vendorData.revisions || {})[0];
    return (vendorData.revisions && vendorData.revisions[firstKey]) || {
      operator: '',
      timestamp: Date.now(),
      model: '',
      firmwareVersion: '',
      captivePortal: {},
      radius: {},
      walledGarden: {},
      loginMethods: {},
    };
  };

  const [snapshot, setSnapshot] = useState<VendorIntegrationSnapshot>(getSnapshot());

  const steps = [
    'Basic Info',
    'Captive Portal',
    'RADIUS',
    'Walled Garden',
    'Login Methods',
  ];

  const updateVendorData = (updatedSnapshot: VendorIntegrationSnapshot) => {
    const updated: Vendor = {
      ...vendorData,
      revisions: {
        'rev1': updatedSnapshot,
      },
      revisionsCount: 1,
    };
    setVendorData(updated);
    onDataChange(updated);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateSnapshot = (field: keyof VendorIntegrationSnapshot, value: any) => {
    const updated = { ...snapshot, [field]: value };
    setSnapshot(updated);
    updateVendorData(updated);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderCaptivePortal();
      case 2:
        return renderRadius();
      case 3:
        return renderWalledGarden();
      case 4:
        return renderLoginMethods();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <div className="wizard-step">
      <h3>Basic Information</h3>

      <div className="form-group">
        <label>Operator / Created By</label>
        <input
          type="text"
          value={snapshot.operator || ''}
          onChange={(e) => updateSnapshot('operator', e.target.value)}
          placeholder="Enter operator name"
        />
      </div>

      <div className="form-group">
        <label>Model</label>
        <input
          type="text"
          value={snapshot.model || ''}
          onChange={(e) => updateSnapshot('model', e.target.value)}
          placeholder="Enter device model"
        />
      </div>

      <div className="form-group">
        <label>Firmware Version</label>
        <input
          type="text"
          value={snapshot.firmwareVersion || ''}
          onChange={(e) => updateSnapshot('firmwareVersion', e.target.value)}
          placeholder="Enter firmware version"
        />
      </div>
    </div>
  );

  const renderCaptivePortal = () => {
    const cp = snapshot.captivePortal || {};

    const updateCaptivePortal = (field: string, value: any) => {
      updateSnapshot('captivePortal', { ...cp, [field]: value });
    };

    return (
      <div className="wizard-step">
        <h3>Captive Portal Configuration</h3>

        <div className="form-group">
          <label>Redirection URL</label>
          <input
            type="url"
            value={cp.redirectionUrl || ''}
            onChange={(e) => updateCaptivePortal('redirectionUrl', e.target.value)}
            placeholder="https://portal.example.com"
          />
        </div>

        <div className="form-group">
          <label>Login URL</label>
          <input
            type="url"
            value={cp.loginUrl || ''}
            onChange={(e) => updateCaptivePortal('loginUrl', e.target.value)}
            placeholder="https://portal.example.com/login"
          />
        </div>

        <div className="form-group">
          <label>Logout URL</label>
          <input
            type="url"
            value={cp.logoutUrl || ''}
            onChange={(e) => updateCaptivePortal('logoutUrl', e.target.value)}
            placeholder="https://portal.example.com/logout"
          />
        </div>

        <div className="form-group">
          <label>Query String Parameters (JSON format)</label>
          <textarea
            value={JSON.stringify(cp.queryStringParameters || {}, null, 2)}
            onChange={(e) => {
              try {
                updateCaptivePortal('queryStringParameters', JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
            placeholder='{"client_mac": "MAC", "client_ip": "IP"}'
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={cp.notes || ''}
            onChange={(e) => updateCaptivePortal('notes', e.target.value)}
            rows={3}
            placeholder="Additional notes about captive portal configuration"
          />
        </div>
      </div>
    );
  };

  const renderRadius = () => {
    const radius = snapshot.radius || {};

    const updateRadius = (field: string, value: any) => {
      updateSnapshot('radius', { ...radius, [field]: value });
    };

    return (
      <div className="wizard-step">
        <h3>RADIUS Configuration</h3>

        <div className="form-group">
          <label>Access Request</label>
          <textarea
            value={radius.accessRequest || ''}
            onChange={(e) => updateRadius('accessRequest', e.target.value)}
            rows={3}
            placeholder="RADIUS Access-Request details"
          />
        </div>

        <div className="form-group">
          <label>Accounting Start</label>
          <textarea
            value={radius.accountingStart || ''}
            onChange={(e) => updateRadius('accountingStart', e.target.value)}
            rows={3}
            placeholder="RADIUS Accounting-Start details"
          />
        </div>

        <div className="form-group">
          <label>Accounting Update</label>
          <textarea
            value={radius.accountingUpdate || ''}
            onChange={(e) => updateRadius('accountingUpdate', e.target.value)}
            rows={3}
            placeholder="RADIUS Accounting-Update details"
          />
        </div>

        <div className="form-group">
          <label>Accounting Stop</label>
          <textarea
            value={radius.accountingStop || ''}
            onChange={(e) => updateRadius('accountingStop', e.target.value)}
            rows={3}
            placeholder="RADIUS Accounting-Stop details"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={radius.supportCoa || false}
                onChange={(e) => updateRadius('supportCoa', e.target.checked)}
              />
              Support CoA (Change of Authorization)
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={radius.supportMacAuthentication || false}
                onChange={(e) => updateRadius('supportMacAuthentication', e.target.checked)}
              />
              Support MAC Authentication
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={radius.supportRoaming || false}
                onChange={(e) => updateRadius('supportRoaming', e.target.checked)}
              />
              Support Roaming
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Packet Source</label>
          <input
            type="text"
            value={radius.packetSource || ''}
            onChange={(e) => updateRadius('packetSource', e.target.value)}
            placeholder="Packet source identifier"
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={radius.notes || ''}
            onChange={(e) => updateRadius('notes', e.target.value)}
            rows={3}
            placeholder="Additional notes about RADIUS configuration"
          />
        </div>
      </div>
    );
  };

  const renderWalledGarden = () => {
    const wg = snapshot.walledGarden || {};

    const updateWalledGarden = (field: string, value: any) => {
      updateSnapshot('walledGarden', { ...wg, [field]: value });
    };

    return (
      <div className="wizard-step">
        <h3>Walled Garden Configuration</h3>

        <div className="form-group">
          <label>Mask (Numeric)</label>
          <input
            type="number"
            value={wg.mask || 0}
            onChange={(e) => updateWalledGarden('mask', parseInt(e.target.value) || 0)}
            placeholder="Enter mask value"
          />
          <small className="help-text">
            Bitmask: BY_IP(1), BY_DOMAIN(2), WITH_WILDCARD(4), BY_PROTOCOL(8), BY_PORT(16)
          </small>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={wg.welcomePage || false}
              onChange={(e) => updateWalledGarden('welcomePage', e.target.checked)}
            />
            Has Welcome Page
          </label>
        </div>
      </div>
    );
  };

  const renderLoginMethods = () => {
    const lm = snapshot.loginMethods || {};

    const updateLoginMethods = (field: string, value: boolean) => {
      updateSnapshot('loginMethods', { ...lm, [field]: value });
    };

    return (
      <div className="wizard-step">
        <h3>Login Methods</h3>

        <div className="checkbox-group">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={lm.supportHttps || false}
                onChange={(e) => updateLoginMethods('supportHttps', e.target.checked)}
              />
              Support HTTPS
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={lm.supportLogout || false}
                onChange={(e) => updateLoginMethods('supportLogout', e.target.checked)}
              />
              Support Logout
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={lm.supportMailSurf || false}
                onChange={(e) => updateLoginMethods('supportMailSurf', e.target.checked)}
              />
              Support Mail Surf
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={lm.supportSmsSurf || false}
                onChange={(e) => updateLoginMethods('supportSmsSurf', e.target.checked)}
              />
              Support SMS Surf
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={lm.supportSocial || false}
                onChange={(e) => updateLoginMethods('supportSocial', e.target.checked)}
              />
              Support Social Login
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="vendor-wizard">
      <div className="wizard-progress">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`progress-step ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
            }`}
            onClick={() => setCurrentStep(index)}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step}</div>
          </div>
        ))}
      </div>

      <div className="wizard-content">{renderStep()}</div>

      <div className="wizard-navigation">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="btn-nav"
        >
          Previous
        </button>
        <div className="step-indicator">
          Step {currentStep + 1} of {steps.length}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className="btn-nav"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default VendorWizard;
