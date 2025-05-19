import React, { useState } from 'react';
import axios from 'axios';
import DiffViewer from 'react-diff-viewer';

const FileCompare = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [diffResult, setDiffResult] = useState('');
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Both files must be selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const res = await axios.post('http://127.0.0.1:5000/compare', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDiffResult(res.data.diff);
      
      const blob = new Blob([res.data.diff], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  const parseDiff = (diffString) => {
    const oldLines = [];
    const newLines = [];

    const lines = diffString.split('\n');
    lines.forEach((line) => {
      if (line.startsWith('-')) oldLines.push(line.slice(1));
      else if (line.startsWith('+')) newLines.push(line.slice(1));
      else if (!line.startsWith('@@') && !line.startsWith('---') && !line.startsWith('+++')) {
        oldLines.push(line);
        newLines.push(line);
      }
    });

    return { oldLines: oldLines.join('\n'), newLines: newLines.join('\n') };
  };

  const { oldLines, newLines } = parseDiff(diffResult);

  return (
  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
    <h2>Compare Two Files</h2>

    <div style={{ marginBottom: '1rem' }}>
      <label><strong>File 1:</strong></label><br />
      <input type="file" onChange={(e) => setFile1(e.target.files[0])} />
      {file1 && <p style={{ fontSize: '0.9rem' }}>Selected: {file1.name}</p>}
    </div>

    <div style={{ marginBottom: '1rem' }}>
      <label><strong>File 2:</strong></label><br />
      <input type="file" onChange={(e) => setFile2(e.target.files[0])} />
      {file2 && <p style={{ fontSize: '0.9rem' }}>Selected: {file2.name}</p>}
    </div>

    <button onClick={handleCompare} style={{
      padding: '10px 20px',
      fontSize: '1rem',
      backgroundColor: '#007BFF',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}>
      Compare
    </button>

    {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

{diffResult && (
  <div style={{ marginTop: '2rem' }}>
    <h3>Results:</h3>
    <DiffViewer
      oldValue={oldLines}
      newValue={newLines}
      splitView={true}
      showDiffOnly={false}
      styles={{
        variables: {
          light: {
            diffViewerBackground: '#f7f7f7',
            addedBackground: '#d4fcdc',
            removedBackground: '#ffecec',
          }
        }
      }}
    />

    {downloadUrl && (
      <a
        href={downloadUrl}
        download="diff_result.txt"
        style={{
          display: 'inline-block',
          marginTop: '1rem',
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}
      >
        Download Diff
      </a>
    )}
  </div>
)}
  </div>
);
};

export default FileCompare;