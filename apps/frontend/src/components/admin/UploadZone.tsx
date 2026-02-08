'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFormats?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function UploadZone({
  onFilesSelected,
  acceptedFormats = ['.svg', '.eps', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.mp4', '.webm'],
  maxFiles = 20,
  maxSizeMB = 500,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `${file.name} exceeds ${maxSizeMB}MB limit`;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      return `${file.name} is not a supported format`;
    }

    return null;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`);
      setErrors(newErrors);
      return;
    }

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesSelected(updatedFiles);
      setErrors([]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['svg', 'eps'].includes(extension || '')) return '📐';
    if (['png', 'jpg', 'jpeg', 'tiff', 'tif'].includes(extension || '')) return '🖼️';
    if (['mp4', 'webm'].includes(extension || '')) return '🎬';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-3xl)',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-gray-50)',
          transition: 'all var(--transition-base)',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <Upload
          size={48}
          style={{
            color: isDragging ? 'var(--color-primary)' : 'var(--color-gray-400)',
            marginBottom: 'var(--spacing-md)',
          }}
        />
        <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
          or click to browse
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-sm)' }}>
          Supports: {acceptedFormats.join(', ').replace(/\./g, '').toUpperCase()}
          <br />
          Max {maxFiles} files, {maxSizeMB}MB per file
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-error)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}
        >
          <AlertCircle size={20} />
          <div>
            {errors.map((error, index) => (
              <p key={index} style={{ margin: 0, fontSize: '0.875rem' }}>
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 'var(--spacing-md)' }}>
            Selected Files ({files.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'white',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{getFileIcon(file)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-error)',
                    cursor: 'pointer',
                    padding: 'var(--spacing-xs)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
