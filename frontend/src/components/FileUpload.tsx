import React, { useRef } from 'react';
import { FileAttachment } from '../types/vendor';
import './FileUpload.css';

interface FileUploadProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  maxFileSize?: number; // in bytes, default 5MB
  acceptedTypes?: string; // e.g., "image/*,.pdf,.pcap"
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  attachments,
  onAttachmentsChange,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = "image/*,.pdf,.pcap,.cap,.txt,.log",
  label = "Attachments"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);

        const attachment: FileAttachment = {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          content: base64,
          size: file.size,
          uploadDate: Date.now(),
          description: ''
        };

        newAttachments.push(attachment);
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
        alert(`Failed to read file: ${file.name}`);
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
  };

  const handleDownload = (attachment: FileAttachment) => {
    const blob = base64ToBlob(attachment.content, attachment.contentType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const base64ToBlob = (base64: string, contentType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isImage = (contentType: string): boolean => {
    return contentType.startsWith('image/');
  };

  const getFileIcon = (contentType: string): string => {
    if (contentType.startsWith('image/')) return '\uD83D\uDDBC\uFE0F'; // 🖼️
    if (contentType.includes('pdf')) return '\uD83D\uDCC4'; // 📄
    if (contentType.includes('pcap') || contentType.includes('cap')) return '\uD83D\uDCE6'; // 📦
    if (contentType.includes('text')) return '\uD83D\uDCC3'; // 📃
    return '\uD83D\uDCC1'; // 📁
  };

  const updateDescription = (index: number, description: string) => {
    const updated = [...attachments];
    updated[index] = { ...updated[index], description };
    onAttachmentsChange(updated);
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-header">
        <label>{label}</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-upload"
        >
          + Add Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {attachments.length > 0 && (
        <div className="attachments-list">
          {attachments.map((attachment, index) => (
            <div key={index} className="attachment-item">
              <div className="attachment-preview">
                {isImage(attachment.contentType) ? (
                  <img
                    src={`data:${attachment.contentType};base64,${attachment.content}`}
                    alt={attachment.filename}
                    className="attachment-thumbnail"
                  />
                ) : (
                  <div className="attachment-icon">
                    {getFileIcon(attachment.contentType)}
                  </div>
                )}
              </div>

              <div className="attachment-details">
                <div className="attachment-filename">{attachment.filename}</div>
                <div className="attachment-meta">
                  {formatFileSize(attachment.size)} • {new Date(attachment.uploadDate).toLocaleDateString()}
                </div>
                <input
                  type="text"
                  placeholder="Add description (optional)"
                  value={attachment.description || ''}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  className="attachment-description-input"
                />
              </div>

              <div className="attachment-actions">
                <button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  className="btn-action btn-download"
                  title="Download"
                >
                  ⬇
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="btn-action btn-delete"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <div className="no-attachments">
          No files attached. Click "Add Files" to upload images, PCAP files, or notes.
        </div>
      )}

      <div className="file-upload-info">
        Max file size: {formatFileSize(maxFileSize)} per file
      </div>
    </div>
  );
};

export default FileUpload;
