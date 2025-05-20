import React from 'react';

const CsvDiffTable = ({ rows }) => {
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4>CSV Diff Preview</h4>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            {rows.length > 0 &&
              rows[0].map((col, i) => <th key={i}>{col}</th>)
            }
          </tr>
        </thead>
        <tbody>
          {rows.slice(1, 101).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 101 && <p>Only showing first 100 rows...</p>}
    </div>
  );
};

export default CsvDiffTable;