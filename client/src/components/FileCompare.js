import React, { useState } from 'react';
import axios from 'axios';
import DiffViewer from 'react-diff-viewer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CsvDiffTable from './CsvDiffTable';

const FileCompare = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [diffResult, setDiffResult] = useState('');
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [fileType, setFileType] = useState('');
  const [oldLines, setOldLines] = useState([]);
  const [newLines, setNewLines] = useState([]);
  const [showFullDiff, setShowFullDiff] = useState(false);

const parseDiff = (diffString) => {
  const oldL = [];
  const newL = [];

  const lines = diffString.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('-') && !line.startsWith('---')) {
      oldL.push(line.slice(1));
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      newL.push(line.slice(1));
    } else if (!line.startsWith('@@') && !line.startsWith('---') && !line.startsWith('+++')) {
      oldL.push(line);
      newL.push(line);
    }
  });

  setOldLines(oldL);
  setNewLines(newL);
};

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Both files must be selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const res = await axios.post('/compare', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFileType(res.data.type);
      
      if (res.data.type === 'csv') {
        setDiffResult(res.data.diff); // CSV: Array of rows
        setDownloadUrl(null);
    } else if (res.data.type === 'text') {
        setDiffResult(res.data.diff); // Text diff
        parseDiff(res.data.diff);

        const blob = new Blob([res.data.diff], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
    }

      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred.');
    }
  };

  return (
    <div>
      <h2>Compare Two Files</h2>
      <div>
        <p>File 1:</p>
        <input type="file" onChange={(e) => setFile1(e.target.files[0])} />
        <p>File 2:</p>
        <input type="file" onChange={(e) => setFile2(e.target.files[0])} />
        <button onClick={handleCompare}>Compare</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {diffResult && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h4>File 1</h4>
            <pre style={{ background: '#f7f7f7', padding: '1rem', overflowX: 'auto' }}>
                {oldLines.slice(0, 100).map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </pre>
        </div>
        <div style={{ flex: 1 }}>
            <h4>File 2</h4>
            <pre style={{ background: 'f7f7f7', padding: '1rem', overflowX: 'auto' }}>
                {newLines.slice(0, 100).map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </pre>
        </div>
    </div>
      )}

      {fileType === 'csv' && Array.isArray(diffResult) && (
  <>
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h4>File 1</h4>
        <div className="csv-table">
          {diffResult.slice(0, showFullDiff ? diffResult.length : 100).map((row, i) => (
            <div key={i} className="csv-row">
              {row.map((cell, j) => (
                <span key={j} style={{ backgroundColor: cell.changed ? '#ffeb3b' : 'transparent', padding: '0 0.5rem' }}>
                  {cell.value1 || cell.value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <h4>File 2</h4>
        <div className="csv-table">
          {diffResult.slice(0, showFullDiff ? diffResult.length : 100).map((row, i) => (
            <div key={i} className="csv-row">
              {row.map((cell, j) => (
                <span key={j} style={{ backgroundColor: cell.changed ? '#ffeb3b' : 'transparent', padding: '0 0.5rem' }}>
                  {cell.value2 || cell.value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
)}

      {fileType === 'text' && (
        <div style={{ marginTop: '2rem' }}>
            <h4>Highlighted Diff (Text)</h4>
            <SyntaxHighlighter language="python" style={oneDark}>
                {showFullDiff ? diffResult : diffResult.split('\n').slice(0, 100).join('\n')}
                </SyntaxHighlighter>
                </div>
            )}
            
            {(fileType === 'csv' || fileType === 'text') && diffResult && (
                <button
                onClick={() => setShowFullDiff(!showFullDiff)}
                style={{
                    marginTop: '1rem',
                    padding: '8px 16px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
                >
                    {showFullDiff ? 'View Less' : 'View More'}
                    </button>
                )}

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
            borderRadius: '5px',
          }}
        >
          Download Diff
        </a>
      )}
    </div>
  );
};

export default FileCompare;