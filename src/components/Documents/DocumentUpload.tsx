import React, { useState, useRef } from "react";
import { Upload, File as LucideFile, X, Download } from "lucide-react"; // File was shadowing DOM File

import { Deal, Document } from "../../types";
import { useAppDispatch } from "../../hooks/redux";
import { updateDeal } from "../../store/slices/dealsSlice";
import api from "../../services/api";

interface DocumentUploadProps {
  deal: Deal;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ deal }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("documents", file);
    });

    try {
      const response = await api.post(
        `/deals/${deal._id}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      dispatch(updateDeal(response));
    } catch (err: any) {
      setError(err.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const response = await api.get(`/documents/${doc._id}/download`);
      const downloadUrl = response.data?.url || response.url;
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes("pdf")) return "📄";
    if (mimetype.includes("word") || mimetype.includes("document")) return "📝";
    if (mimetype.includes("image")) return "🖼️";
    return "📎";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-300 mb-2">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </p>
        <p className="text-gray-500 text-sm">
          Supports PDF, DOCX, and image files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Document List */}
      {deal.documents && deal.documents.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-300 mb-3">
            Uploaded Documents ({deal.documents.length})
          </h4>
          <div className="space-y-3">
            {deal.documents.map((doc) => {
              if (!doc || !doc._id) return null;

              return (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getFileIcon(doc.mimetype)}</span>
                    <div>
                      <p className="text-white font-medium">
                        {doc.originalName}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(doc.size)} •{" "}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
