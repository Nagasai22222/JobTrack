import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/api';
import type { DocumentResponse, DocumentType } from '../../types';
import { LoadingState } from '../common/LoadingState';
import { ErrorMessage } from '../common/ErrorMessage';
import { SuccessMessage } from '../common/SuccessMessage';
import { EmptyState } from '../common/EmptyState';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  FileCheck,
  AlertTriangle,
  Loader2,
  HardDrive,
  Calendar,
} from 'lucide-react';

interface ApplicationDocumentsProps {
  applicationId: number;
  onDocumentChange?: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'RESUME', label: 'Resume' },
  { value: 'COVER_LETTER', label: 'Cover Letter' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'JOB_DESCRIPTION', label: 'Job Description' },
  { value: 'INTERVIEW_DOCUMENT', label: 'Interview Document' },
  { value: 'OTHER', label: 'Other Document' },
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ApplicationDocuments: React.FC<ApplicationDocumentsProps> = ({
  applicationId,
  onDocumentChange,
}) => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('RESUME');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Download State
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationService.getDocuments(applicationId);
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch application documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [applicationId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileNameLower = file.name.toLowerCase();
      const ext = fileNameLower.substring(fileNameLower.lastIndexOf('.'));

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(
          `Invalid file format '${ext}'. Allowed file types are: ${ALLOWED_EXTENSIONS.join(', ')}.`
        );
        setSelectedFile(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(
          `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB uploaded).`
        );
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await applicationService.uploadDocument(applicationId, selectedFile, documentType);
      setSuccessMsg(`Uploaded ${selectedFile.name} successfully.`);
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchDocuments();
      if (onDocumentChange) onDocumentChange();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentResponse) => {
    setDownloadingId(doc.id);
    setError(null);
    try {
      await applicationService.downloadDocument(applicationId, doc.id, doc.originalFileName);
    } catch (err: any) {
      setError(err.message || 'Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    setIsDeleting(true);
    setError(null);
    try {
      await applicationService.deleteDocument(applicationId, documentId);
      setDeletingId(null);
      setSuccessMsg('Document deleted successfully.');
      fetchDocuments();
      if (onDocumentChange) onDocumentChange();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Application Documents & Attachments</h3>
            <p className="text-xs text-slate-400">Upload resumes, cover letters, and offer documents (Max 5MB PDF, TXT, DOC, DOCX)</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </span>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMsg && <SuccessMessage message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      {/* Document Upload Form */}
      <form onSubmit={handleUpload} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Document File <span className="text-rose-400">*</span>
            </label>
            <input
              id="doc-file-input"
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Document Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Document Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              disabled={isUploading}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Supported formats: PDF, TXT, DOC, DOCX up to 5 MB
          </span>
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Documents List Table */}
      {isLoading ? (
        <LoadingState message="Fetching attached documents..." />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents attached yet"
          description="Upload your resume, cover letter, or offer documentation using the panel above."
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/60 transition-all"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{doc.originalFileName}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md border border-slate-700">
                      {doc.documentType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 font-medium">
                    <span className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
                  title="Download File"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setDeletingId(doc.id)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Delete Confirmation */}
              {deletingId === doc.id && (
                <div className="w-full mt-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300">
                  <span className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Delete {doc.originalFileName}?</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting}
                      className="px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-500 rounded-lg flex items-center space-x-1 cursor-pointer font-semibold"
                    >
                      {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
