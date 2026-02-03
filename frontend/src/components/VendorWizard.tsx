import React, { useState } from 'react';
import { Vendor, VendorIntegrationSnapshot, FileAttachment } from '../types/vendor';
import { useSettings } from '../contexts/SettingsContext';
import { parsePcapFile, PcapParseResponse, RadiusPacketData } from '../services/pcapService';
import FileUpload from './FileUpload';
import './VendorWizard.css';

interface VendorWizardProps {
  initialData: Vendor;
  onDataChange: (data: Vendor) => void;
}

const VendorWizard: React.FC<VendorWizardProps> = ({ initialData, onDataChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [vendorData, setVendorData] = useState<Vendor>(initialData);
  const { standardParams } = useSettings();

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
  const [showNginxParamsModal, setShowNginxParamsModal] = useState(false);
  const [nginxParams, setNginxParams] = useState({
    redirectFilter: '',
    ipAddress: '',
  });

  // PCAP parsing state
  const [showPcapParamsModal, setShowPcapParamsModal] = useState(false);
  const [pcapParams, setPcapParams] = useState({
    sourceIpFilter: '',
    textFilter: '',
  });
  const [pcapParseResult, setPcapParseResult] = useState<PcapParseResponse | null>(null);
  const [showPcapResultsModal, setShowPcapResultsModal] = useState(false);
  const [pcapLoading, setPcapLoading] = useState(false);

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

  const handleNginxUpload = () => {
    setShowNginxParamsModal(true);
  };

  const handleNginxParamsConfirm = () => {
    setShowNginxParamsModal(false);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.log';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();

        // Nginx log format regex with named groups
        const nginxLogPattern = /^(?<clientIp>\S+)\s+\[(?<timestamp>[^\]]+)\]\s+(?<scheme>\w+):\/\/(?<host>[^:]+):(?<port>\d+)\s+"(?<method>\w+)\s+(?<path>[^\s?]+)(?:\?(?<queryString>[^\s]+))?\s+HTTP\/[\d.]+"\s*(?<statusCode>\d+)\s+(?<responseSize>\d+)\s+"(?<referer>[^"]*)"\s+"(?<userAgent>[^"]*)"\s+"(?<extraField>[^"]*)"\s+"(?<cookie>[^"]*)"/;

        const lines = text.split('\n');
        const parsedData: any = {
          redirectionUrl: '',
          loginUrl: '',
          logoutUrl: '',
          queryStringParameters: {} as { [key: string]: string },
        };

        let matchCount = 0;

        for (const line of lines) {
          if (!line.trim()) continue;

          const match = line.match(nginxLogPattern);
          if (!match || !match.groups) continue;

          const { clientIp, timestamp, scheme, host, port, method, path, queryString, statusCode, referer, userAgent } = match.groups;

          // Apply IP address filter if provided
          if (nginxParams.ipAddress && clientIp !== nginxParams.ipAddress) {
            continue;
          }

          // Apply redirect filter if provided (check if path contains the filter)
          if (nginxParams.redirectFilter && !path.includes(nginxParams.redirectFilter)) {
            continue;
          }

          matchCount++;

          // Parse query string parameters
          if (queryString) {
            const params = new URLSearchParams(queryString);
            params.forEach((value, key) => {
              if (!parsedData.queryStringParameters[key]) {
                parsedData.queryStringParameters[key] = decodeURIComponent(value);
              }
            });
          }

          // Build full URL
          const fullUrl = `${scheme}://${host}${port && port !== '80' && port !== '443' ? ':' + port : ''}${path}\?${queryString}`;

          // Detect URL types based on path
          if (path.includes('/start') || path.includes('/redirect')) {
            parsedData.redirectionUrl = fullUrl;
          }
        }

        if (matchCount > 0) {
          // Update captive portal with parsed data
          const cp = snapshot.captivePortal || {};
          updateSnapshot('captivePortal', {
            ...cp,
            ...parsedData,
            notes: (cp.notes || '') + `\n\nParsed from nginx log (${matchCount} matching entries)`,
          });
        } else {
          alert('No matching log entries found with the given filters.');
        }

      } catch (err) {
        console.error('Failed to parse nginx log:', err);
        alert('Failed to parse nginx log file');
      }
    };
    input.click();
  };

  const handlePcapUpload = async () => {
    setShowPcapParamsModal(true);
  };

  const handlePcapParamsConfirm = () => {
    setShowPcapParamsModal(false);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pcap,.cap';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setPcapLoading(true);

      try {
        const response = await parsePcapFile(
          file,
          pcapParams.sourceIpFilter || undefined,
          pcapParams.textFilter || undefined
        );

        setPcapParseResult(response);
        setShowPcapResultsModal(true);
      } catch (err: any) {
        console.error('Failed to parse PCAP file:', err);
        alert('Failed to parse PCAP file: ' + (err.message || 'Unknown error'));
      } finally {
        setPcapLoading(false);
      }
    };
    input.click();
  };

  const handleApplyPcapResults = () => {
    if (!pcapParseResult) return;

    const radius = snapshot.radius || {};

    // Build text summaries for each packet type
    const accessRequestSummary = pcapParseResult.accessRequests
      .map((p) => `[${new Date(p.timestamp).toISOString()}] ${p.sourceIp} -> ${p.destinationIp}\n${p.rawData}`)
      .join('\n---\n');

    const accountingStartSummary = pcapParseResult.accountingStarts
      .map((p) => `[${new Date(p.timestamp).toISOString()}] ${p.sourceIp} -> ${p.destinationIp}\n${p.rawData}`)
      .join('\n---\n');

    const accountingUpdateSummary = pcapParseResult.accountingUpdates
      .map((p) => `[${new Date(p.timestamp).toISOString()}] ${p.sourceIp} -> ${p.destinationIp}\n${p.rawData}`)
      .join('\n---\n');

    const accountingStopSummary = pcapParseResult.accountingStops
      .map((p) => `[${new Date(p.timestamp).toISOString()}] ${p.sourceIp} -> ${p.destinationIp}\n${p.rawData}`)
      .join('\n---\n');

    // Update RADIUS fields
    updateSnapshot('radius', {
      ...radius,
      accessRequest: accessRequestSummary || radius.accessRequest,
      accountingStart: accountingStartSummary || radius.accountingStart,
      accountingUpdate: accountingUpdateSummary || radius.accountingUpdate,
      accountingStop: accountingStopSummary || radius.accountingStop,
      notes: (radius.notes || '') +
        `\n\nParsed from PCAP (${pcapParseResult.radiusPacketsFound} RADIUS packets found, ${pcapParseResult.totalPacketsProcessed} total packets processed)`,
    });

    setShowPcapResultsModal(false);
    setPcapParseResult(null);
  }

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

      <FileUpload
        attachments={snapshot.attachments || []}
        onAttachmentsChange={(attachments) => updateSnapshot('attachments', attachments)}
        label="Basic Info Attachments"
      />
    </div>
  );

  const renderCaptivePortal = () => {
    const cp = snapshot.captivePortal || {};

    const updateCaptivePortal = (field: string, value: any) => {
      updateSnapshot('captivePortal', { ...cp, [field]: value });
    };

    return (
      <div className="wizard-step">
        <div className="title-and-button">
          <h3>Captive Portal Configuration</h3>
          <button
          type="button"
          onClick={handleNginxUpload}
          className="btn-sample"
          >
            Upload nginx logs
          </button>
        </div>

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
          <label>Query String Parameters</label>
          {Object.keys(cp.queryStringParameters || {}).length > 0 ? (
            <table className="params-table">
              <thead>
                <tr>
                  <th>Param Name</th>
                  <th>Example Value</th>
                  <th>Mapped To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(cp.queryStringParameters || {}).map(([paramName, exampleValue]) => (
                  <tr key={paramName}>
                    <td className="param-name">{paramName}</td>
                    <td className="example-value" title={exampleValue}>{exampleValue}</td>
                    <td>
                      <select
                        value={(cp.queryStringMapping || {})[paramName] || ''}
                        onChange={(e) => {
                          const newMapping = { ...(cp.queryStringMapping || {}), [paramName]: e.target.value };
                          updateCaptivePortal('queryStringMapping', newMapping);
                        }}
                        className="mapping-select"
                      >
                        <option value="">-- Not Mapped --</option>
                        {standardParams.map((stdParam) => (
                          <option key={stdParam} value={stdParam}>
                            {stdParam}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          const newParams = { ...cp.queryStringParameters };
                          const newMapping = { ...cp.queryStringMapping };
                          delete newParams[paramName];
                          delete newMapping[paramName];
                          updateCaptivePortal('queryStringParameters', newParams);
                          updateCaptivePortal('queryStringMapping', newMapping);
                        }}
                        className="btn-delete-param"
                        title="Remove parameter"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-params-message">No query string parameters defined. Upload nginx logs to extract parameters automatically.</p>
          )}
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

        <FileUpload
          attachments={cp.attachments || []}
          onAttachmentsChange={(attachments) => updateCaptivePortal('attachments', attachments)}
          label="Captive Portal Attachments"
        />
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
        <div className="title-and-button">
          <h3>RADIUS Configuration</h3>
          <button
          type="button"
          onClick={handlePcapUpload}
          className="btn-sample"
          >
            Upload RADIUS pcap
          </button>
        </div>

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

        <FileUpload
          attachments={radius.attachments || []}
          onAttachmentsChange={(attachments) => updateRadius('attachments', attachments)}
          label="RADIUS Attachments"
        />
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

        <div className="form-group">
          <label>Notes</label>
            <textarea
                value={wg.notes || ''}
                onChange={(e) => updateWalledGarden('notes', e.target.value)}
                rows={3}
                placeholder="Additional notes about walled garden configuration"
            />
        </div>

        <FileUpload
          attachments={wg.attachments || []}
          onAttachmentsChange={(attachments) => updateWalledGarden('attachments', attachments)}
          label="Walled Garden Attachments"
        />
      </div>
    );
  };

  const renderLoginMethods = () => {
    const lm = snapshot.loginMethods || {};

    const updateLoginMethods = (field: string, value: any) => {
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

          <div className="form-group">
            <label>Notes</label>
              <textarea
                  value={lm.notes || ''}
                  onChange={(e) => updateLoginMethods('notes', e.target.value)}
                  rows={3}
                  placeholder="Additional notes about login methods configuration"
              />
          </div>

          <FileUpload
            attachments={lm.attachments || []}
            onAttachmentsChange={(attachments) => updateLoginMethods('attachments', attachments)}
            label="Login Methods Attachments"
          />
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

      {showNginxParamsModal && (
        <div className="modal-overlay" onClick={() => setShowNginxParamsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Nginx Log Upload Parameters</h3>

            <div className="form-group">
              <label>Redirect Filter</label>
              <input
                type="text"
                value={nginxParams.redirectFilter}
                onChange={(e) => setNginxParams({ ...nginxParams, redirectFilter: e.target.value })}
                placeholder="Enter redirect filter string"
              />
            </div>

            <div className="form-group">
              <label>IP Address</label>
              <input
                type="text"
                value={nginxParams.ipAddress}
                onChange={(e) => setNginxParams({ ...nginxParams, ipAddress: e.target.value })}
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowNginxParamsModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNginxParamsConfirm}
                className="btn-submit"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showPcapParamsModal && (
        <div className="modal-overlay" onClick={() => setShowPcapParamsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>PCAP Upload Parameters</h3>

            <div className="form-group">
              <label>Source IP Filter (optional)</label>
              <input
                type="text"
                value={pcapParams.sourceIpFilter}
                onChange={(e) => setPcapParams({ ...pcapParams, sourceIpFilter: e.target.value })}
                placeholder="Enter source IP address (e.g., 192.168.1.1)"
                pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
              />
              <small className="help-text">Filter packets by source IP address</small>
            </div>

            <div className="form-group">
              <label>Text Filter (optional)</label>
              <input
                type="text"
                value={pcapParams.textFilter}
                onChange={(e) => setPcapParams({ ...pcapParams, textFilter: e.target.value })}
                placeholder="Enter text to search in packet data"
              />
              <small className="help-text">Filter packets containing specific text in attributes</small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowPcapParamsModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePcapParamsConfirm}
                className="btn-submit"
                disabled={pcapLoading}
              >
                {pcapLoading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPcapResultsModal && pcapParseResult && (
        <div className="modal-overlay" onClick={() => setShowPcapResultsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>PCAP Parse Results</h3>

            <div className="parse-summary">
              <p><strong>Total Packets:</strong> {pcapParseResult.totalPacketsProcessed}</p>
              <p><strong>RADIUS Packets Found:</strong> {pcapParseResult.radiusPacketsFound}</p>
            </div>

            {pcapParseResult.accessRequests.length > 0 && (
              <div className="packet-section">
                <h4>Access-Request Packets ({pcapParseResult.accessRequests.length})</h4>
                <div className="packet-table-wrapper">
                  <table className="packet-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Source IP</th>
                        <th>Dest IP</th>
                        <th>Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pcapParseResult.accessRequests.map((packet, idx) => (
                        <tr key={idx}>
                          <td>{new Date(packet.timestamp).toLocaleString()}</td>
                          <td>{packet.sourceIp}</td>
                          <td>{packet.destinationIp}</td>
                          <td>
                            <details>
                              <summary>{Object.keys(packet.attributes).length} attributes</summary>
                              <pre className="packet-details">{JSON.stringify(packet.attributes, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pcapParseResult.accountingStarts.length > 0 && (
              <div className="packet-section">
                <h4>Accounting-Start Packets ({pcapParseResult.accountingStarts.length})</h4>
                <div className="packet-table-wrapper">
                  <table className="packet-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Source IP</th>
                        <th>Dest IP</th>
                        <th>Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pcapParseResult.accountingStarts.map((packet, idx) => (
                        <tr key={idx}>
                          <td>{new Date(packet.timestamp).toLocaleString()}</td>
                          <td>{packet.sourceIp}</td>
                          <td>{packet.destinationIp}</td>
                          <td>
                            <details>
                              <summary>{Object.keys(packet.attributes).length} attributes</summary>
                              <pre className="packet-details">{JSON.stringify(packet.attributes, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pcapParseResult.accountingUpdates.length > 0 && (
              <div className="packet-section">
                <h4>Accounting-Interim-Update Packets ({pcapParseResult.accountingUpdates.length})</h4>
                <div className="packet-table-wrapper">
                  <table className="packet-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Source IP</th>
                        <th>Dest IP</th>
                        <th>Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pcapParseResult.accountingUpdates.map((packet, idx) => (
                        <tr key={idx}>
                          <td>{new Date(packet.timestamp).toLocaleString()}</td>
                          <td>{packet.sourceIp}</td>
                          <td>{packet.destinationIp}</td>
                          <td>
                            <details>
                              <summary>{Object.keys(packet.attributes).length} attributes</summary>
                              <pre className="packet-details">{JSON.stringify(packet.attributes, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pcapParseResult.accountingStops.length > 0 && (
              <div className="packet-section">
                <h4>Accounting-Stop Packets ({pcapParseResult.accountingStops.length})</h4>
                <div className="packet-table-wrapper">
                  <table className="packet-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Source IP</th>
                        <th>Dest IP</th>
                        <th>Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pcapParseResult.accountingStops.map((packet, idx) => (
                        <tr key={idx}>
                          <td>{new Date(packet.timestamp).toLocaleString()}</td>
                          <td>{packet.sourceIp}</td>
                          <td>{packet.destinationIp}</td>
                          <td>
                            <details>
                              <summary>{Object.keys(packet.attributes).length} attributes</summary>
                              <pre className="packet-details">{JSON.stringify(packet.attributes, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pcapParseResult.radiusPacketsFound === 0 && (
              <p className="no-packets-message">No RADIUS packets found matching the filters.</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowPcapResultsModal(false);
                  setPcapParseResult(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPcapResults}
                className="btn-submit"
                disabled={pcapParseResult.radiusPacketsFound === 0}
              >
                Apply to RADIUS Fields
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorWizard;
