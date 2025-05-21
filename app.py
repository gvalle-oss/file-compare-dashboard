import os
import mimetypes
import csv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask import send_from_directory
import difflib

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def save_file(file):
    path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(path)
    return path

def compare_text(file1, file2):
    diff = difflib.unified_diff(
        file1.readlines(),
        file2.readlines(),
        fromfile='file1',
        tofile='file2',
        lineterm=''
    )
    return '\n'.join(diff)

def compare_csv(file1, file2):
    reader1 = list(csv.reader(file1))
    reader2 = list(csv.reader(file2))

    max_len = max(len(reader1), len(reader2))
    rows = []

    for i in range(max_len):
        row1 = reader1[i] if i < len(reader1) else [''] * len(reader2[0])
        row2 = reader2[i] if i < len(reader2) else [''] * len(reader1[0])
        row_diff = []

        for cell1, cell2 in zip(row1, row2):
            if cell1 == cell2:
                row_diff.append({'value': cell1, 'changed': False})
            else:
                row_diff.append({'value1': cell1, 'value2': cell2, 'changed': True})

        rows.append(row_diff)

    return rows

@app.route('/compare', methods=['POST'])
def compare_files():
    print("Compare route hit")
    file1 = request.files.get('file1')
    file2 = request.files.get('file2')

    if not file1 or not file2:
        print("One or both files missing")
        return jsonify({'error': 'Both files must be uploaded.'}), 400

    # Get file extensions
    ext1 = file1.filename.lower().split('.')[-1]
    ext2 = file2.filename.lower().split('.')[-1]

    if ext1 != ext2 or ext1 not in ['txt', 'csv', 'py', 'xml']:
        return jsonify({'error': 'File types do not match or are unsupported.'}), 400

    # Save files
    path1 = save_file(file1)
    path2 = save_file(file2)

    # Compare content
    with open(path1, 'r') as f1, open(path2, 'r') as f2:
        if ext1 == 'csv':
            diff = compare_csv(f1, f2)
            return jsonify({'type': 'csv', 'diff': diff})
        elif ext1 in ['txt', 'py', 'xml']:
            diff = compare_text(f1, f2)
            return jsonify({'type': 'text', 'diff': diff})
        
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve(path):
            if path != "" and os.path.exists(os.path.join('client', 'build', path)):
                return send_from_directory(os.path.join('client', 'build'), path)
            else:
                return send_from_directory(os.path.join('client', 'build'), 'index.html')

if __name__ == '__main__':
    app.run(debug=True)