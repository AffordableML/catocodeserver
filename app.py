import sqlite3
import uuid
import mimetypes
import base64
from flask import Flask, render_template, request, jsonify, Response, redirect, url_for

app = Flask(__name__)
# Increased max content length for larger projects with assets
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database using the schema.sql file."""
    with app.app_context():
        conn = get_db_connection()
        with app.open_resource('schema.sql', mode='r') as f:
            conn.cursor().executescript(f.read())
        conn.commit()

@app.cli.command('initdb')
def initdb_command():
    """Flask command to initialize the database."""
    init_db()
    print('Initialized the database.')

@app.route('/')
def index():
    """Renders the main editor page."""
    return render_template('index.html')

@app.route('/save', methods=['POST'])
def save():
    """Saves a project's files and returns a unique shareable link."""
    data = request.get_json()
    if not data or 'files' not in data:
        return jsonify({'error': 'Invalid data'}), 400
        
    files = data.get('files')
    project_id = str(uuid.uuid4())

    conn = get_db_connection()
    for file_data in files:
        # The content is received as a base64 string for binary safety
        content_bytes = base64.b64decode(file_data['content_b64'])
        conn.execute('INSERT INTO files (project_id, filepath, content) VALUES (?, ?, ?)',
                     (project_id, file_data['path'], content_bytes))
    conn.commit()
    conn.close()

    share_link = url_for('share', project_id=project_id, _external=True)
    return jsonify({'share_link': share_link})

@app.route('/share/<project_id>')
def share(project_id):
    """Redirects a base share link to the project's 'index.html'."""
    return redirect(url_for('view_file', project_id=project_id, filepath='index.html'))

@app.route('/view/<project_id>/<path:filepath>')
def view_file(project_id, filepath):
    """Serves a specific file from a saved project."""
    conn = get_db_connection()
    file_row = conn.execute('SELECT content FROM files WHERE project_id = ? AND filepath = ?',
                         (project_id, filepath)).fetchone()
    conn.close()

    if file_row is None:
        return "File not found.", 404

    content = file_row['content']
    
    mimetype = mimetypes.guess_type(filepath)[0] or 'application/octet-stream'
    
    return Response(content, mimetype=mimetype)

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
