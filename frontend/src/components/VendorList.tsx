import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorService } from '../services/vendorService';
import { VendorConfiguration, VendorSummary } from '../types/vendor';
import Navbar from './Navbar';
import './VendorList.css';

const VendorList: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const allConfigs = await vendorService.getAllVendors();

      // Group by vendor name and create summaries
      const vendorMap = new Map<string, VendorConfiguration[]>();

      allConfigs.forEach((config) => {
        if (!vendorMap.has(config.vendorName)) {
          vendorMap.set(config.vendorName, []);
        }
        vendorMap.get(config.vendorName)!.push(config);
      });

      const summaries: VendorSummary[] = Array.from(vendorMap.entries()).map(
        ([vendorName, configs]) => {
          // Sort by version descending to get latest
          const sortedConfigs = configs.sort((a, b) => b.version - a.version);
          return {
            vendorName,
            versionCount: configs.length,
            latestVersion: sortedConfigs[0],
          };
        }
      );

      // Sort by last update time
      summaries.sort(
        (a, b) =>
          new Date(b.latestVersion.updatedAt).getTime() -
          new Date(a.latestVersion.updatedAt).getTime()
      );

      setVendors(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleVendorClick = (vendorName: string) => {
    navigate(`/vendors/${encodeURIComponent(vendorName)}`);
  };

  const handleCreateNew = () => {
    navigate('/vendors/new');
  };

  if (loading) {
    return (
      <div className="vendor-list-container">
        <div className="loading">Loading vendors...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="vendor-list-container">
        <div className="vendor-list-header">
        <h2>Vendor Configurations</h2>
        <button onClick={handleCreateNew} className="btn-primary">
          Create New Vendor
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {vendors.length === 0 ? (
        <div className="empty-state">
          <p>No vendor configurations found.</p>
          <button onClick={handleCreateNew} className="btn-primary">
            Create Your First Vendor
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Versions</th>
                <th>Latest Version</th>
                <th>Owner</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.vendorName}
                  onClick={() => handleVendorClick(vendor.vendorName)}
                  className="clickable-row"
                >
                  <td className="vendor-name">{vendor.vendorName}</td>
                  <td>{vendor.versionCount}</td>
                  <td>v{vendor.latestVersion.version}</td>
                  <td>{vendor.latestVersion.ownerUsername}</td>
                  <td>{formatDate(vendor.latestVersion.updatedAt)}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVendorClick(vendor.vendorName);
                      }}
                      className="btn-view"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </>
  );
};

export default VendorList;
