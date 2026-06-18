import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documents } from '../services/api';
import FileUploadZone from '../components/FileUploadZone';

export default function UploadPage() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await documents.upload(formData);
      navigate(`/documents/${response.data.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <h2>Upload Document</h2>
      <p className="text-muted mb-3">
        Upload a PDF or image of a government document to digitize it
      </p>
      <FileUploadZone onFileUpload={handleFileUpload} disabled={uploading} />
      {uploading && (
        <div className="mt-3 text-center">
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p className="mt-2">Uploading...</p>
        </div>
      )}
    </div>
  );
}
