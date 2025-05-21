Python 3.10.6 (tags/v3.10.6:9c7b4bd, Aug  1 2022, 21:53:49) [MSC v.1932 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license()" for more information.



from flask import Flask, request, jsonify
from flask_cors import CORS
import difflib
import csv

app = Flask(__name__)
CORS(app)

def compare_text(file1, file2):
    lines1 = file1.read().decode("utf-8").splitlines()
    lines2 = file2.read().decode("utf-8").splitlines()
    diff = '\n'.join(difflib.unified_diff(lines1, lines2, fromfile='file1', tofile='file2'))
    return diff

def compare_csv(file1, file2):
    reader1 = list(csv.reader(file1.read().decode('utf-8').splitlines()))
    reader2 = list(csv.reader(file2.read().decode('utf-8').splitlines()))

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
    file1 = request.files.get('file1')
    file2 = request.files.get('file2')

    if not file1 or not file2:
        return jsonify({'error': 'Both files must be uploaded.'}), 400

    ext1 = file1.filename.lower().split('.')[-1]
    ext2 = file2.filename.lower().split('.')[-1]

    if ext1 != ext2:
        return jsonify({'error': 'File types do not match.'}), 400

    if ext1 == 'csv':
        result = compare_csv(file1, file2)
        return jsonify({'type': 'csv', 'diff': result})

    else:
        result = compare_text(file1, file2)
        return jsonify({'type': 'text', 'diff': result})