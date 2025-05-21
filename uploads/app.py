import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import difflib
import pandas as pd
import magic # For MIME type detection

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def save_file(file):
    path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(path)
    return path

def get_mime_type(file_path):
    return magic.from_file(file_path, mime=True)

def compare_txt(file1, file2):
    with open(file1) as f1, open(file2) as f2:
        diff = difflib.unified_diff(
            f1.readlines(), f2.readlines(),
            fromfile='file1', tofile='file2', lineterm=''
        )
        return '\n'.join(diff)

def compare_csv(file1, file2):
    df1 = pd.read_csv(file1)
    df2 = pd.read_csv(file2)
    if df1.equals(df2):
        return "CSV files are identical."
    else:
        return df1.compare(df2).to_string()

def compare_py(file1, file2):
    return compare_txt(file1, file2)

@app.route('/compare', methods=['POST'])
def compare_files():
    file1 = request.files['file1']
    file2 = request.files['file2']

    path1 = save_file(file1)
    path2 = save_file(file2)

    mime1 = get_mime_type(path1)
    mime2 = get_mime_type(path2)

    # Check for same file type
    if mime1 != mime2:
        return jsonify({"error": "File types do not match"}), 400

    if mime1 == 'text/plain':
        result = compare_txt(path1, path2)
    elif mime1 == 'text/csv':
        result = compare_csv(path1, path2)
    elif path1.endswith('.py') and path2.endswith('.py'):
        result = compare_py(path1, path2)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    return jsonify({"diff": result})

if __name__ == '__main__':
    app.run(debug=True)