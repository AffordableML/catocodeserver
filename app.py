import sqlite3
import uuid
import base64
import mimetypes
import io
import imghdr
import sys
import os
import secrets
import math, datetime, json, random, re
import openai
from flask import Flask, render_template, request, jsonify, Response, redirect, url_for, flash, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

# ===== DATABASE CONFIGURATION =====
# Set to 'postgres' to use PostgreSQL, or 'sqlite' to use SQLite
DATABASE_TYPE = os.environ.get('DATABASE_TYPE', 'sqlite')

# PostgreSQL connection settings (used when DATABASE_TYPE = 'postgres')
POSTGRES_CONFIG = {
    'host': os.environ.get('POSTGRES_HOST', 'localhost'),
    'port': os.environ.get('POSTGRES_PORT', '5432'),
    'database': os.environ.get('POSTGRES_DB', 'catocode'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', '')
}

# SQLite database file (used when DATABASE_TYPE = 'sqlite')
DATABASE = 'database.db'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'catocode-ultra-secret-2025'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, username, storage_used):
        self.id = id; self.username = username; self.storage_used = storage_used

@login_manager.user_loader
def load_user(uid):
    u = get_db().execute('SELECT * FROM users WHERE id = ?', (uid,)).fetchone()
    return User(u['id'], u['username'], u['storage_used']) if u else None

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        if DATABASE_TYPE == 'postgres':
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(
                host=POSTGRES_CONFIG['host'],
                port=POSTGRES_CONFIG['port'],
                database=POSTGRES_CONFIG['database'],
                user=POSTGRES_CONFIG['user'],
                password=POSTGRES_CONFIG['password']
            )
            conn.row_factory = RealDictCursor
            db = g._database = conn
        else:
            db = g._database = sqlite3.connect(DATABASE)
            db.row_factory = sqlite3.Row
    
    # Return a wrapper that handles placeholder conversion
    return DBWrapper(db, DATABASE_TYPE)

class DBWrapper:
    """Wrapper for database connections that handles SQLite/PostgreSQL differences"""
    
    def __init__(self, conn, db_type):
        self._conn = conn
        self._db_type = db_type
        self._cursor = None
    
    def _convert_query(self, query, args):
        """Convert SQLite ? placeholders to PostgreSQL %s"""
        if self._db_type == 'postgres' and '?' in query:
            return query.replace('?', '%s'), args
        return query, args
    
    def execute(self, query, args=()):
        query, args = self._convert_query(query, args)
        self._cursor = self._conn.cursor()
        self._cursor.execute(query, args)
        return self
    
    def executescript(self, script):
        """Only available for SQLite"""
        if self._db_type == 'sqlite':
            self._cursor = self._conn.cursor()
            self._cursor.executescript(script)
        else:
            # For PostgreSQL, execute statements one by one
            statements = [s.strip() for s in script.split(';') if s.strip()]
            self._cursor = self._conn.cursor()
            for stmt in statements:
                if stmt and not stmt.startswith('--'):
                    self._cursor.execute(stmt)
        return self
    
    def fetchone(self):
        if self._cursor:
            return self._cursor.fetchone()
        return None
    
    def fetchall(self):
        if self._cursor:
            return self._cursor.fetchall()
        return []
    
    def commit(self):
        self._conn.commit()
    
    def close(self):
        if self._cursor:
            self._cursor.close()
        self._conn.close()
    
    @property
    def cursor(self):
        if not self._cursor:
            self._cursor = self._conn.cursor()
        return self._cursor

@app.teardown_appcontext
def close_connection(e): 
    db = getattr(g, '_database', None)
    if db: 
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        if DATABASE_TYPE == 'postgres':
            # PostgreSQL schema - need to convert from SQLite syntax
            with app.open_resource('schema.sql', mode='r') as f:
                schema = f.read()
            # Convert SQLite-specific syntax to PostgreSQL
            schema = schema.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
            schema = schema.replace('AUTOINCREMENT', '')
            # Execute each statement separately
            statements = schema.split(';')
            cursor = db.cursor
            for stmt in statements:
                stmt = stmt.strip()
                if stmt and not stmt.startswith('--'):
                    try:
                        cursor.execute(stmt)
                    except Exception as e:
                        print(f"Error executing: {stmt[:50]}... - {e}")
            db.commit()
        else:
            # SQLite: use raw connection for executescript
            import sqlite3
            raw_conn = sqlite3.connect(DATABASE)
            with app.open_resource('schema.sql', mode='r') as f:
                raw_conn.executescript(f.read())
            raw_conn.commit()
            raw_conn.close()

def ensure_gamedev_tables():
    db = get_db()
    try:
        db.execute('SELECT 1 FROM gamedev_games LIMIT 1')
    except:
        db.execute('''CREATE TABLE IF NOT EXISTS gamedev_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            project_uid TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            code TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )''')
        db.commit()

@app.cli.command('initdb')
def initdb_command(): init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/pixel-editor')
def pixel_editor():
    return render_template('pixel-editor.html')


TEMPLATES = {
    'blank': [
        ('index.html', b'<!DOCTYPE html>\n<html>\n<head>\n    <title>My Site</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World</h1>\n    <p>Start building!</p>\n    <script src="script.js"></script>\n</body>\n</html>'),
        ('style.css', b'body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 20px; }'),
        ('script.js', b'console.log("Hello!");')
    ],
    'portfolio': [
        ('index.html', b'<!DOCTYPE html>\n<html>\n<head>\n    <title>My Portfolio</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <nav>\n        <div class="logo">Portfolio</div>\n        <div class="links">\n            <a href="#about">About</a>\n            <a href="#projects">Projects</a>\n            <a href="#contact">Contact</a>\n        </div>\n    </nav>\n    <header>\n        <h1>Hi, I am a Developer</h1>\n        <p>I build amazing web experiences</p>\n    </header>\n    <section id="about">\n        <h2>About Me</h2>\n        <p>I am a passionate developer.</p>\n    </section>\n    <section id="projects">\n        <h2>My Projects</h2>\n        <div class="project-grid">\n            <div class="project"><h3>Project 1</h3><p>A cool project</p></div>\n            <div class="project"><h3>Project 2</h3><p>Another project</p></div>\n        </div>\n    </section>\n    <section id="contact">\n        <h2>Contact</h2>\n        <form>\n            <input placeholder="Name">\n            <input placeholder="Email">\n            <textarea placeholder="Message"></textarea>\n            <button>Send</button>\n        </form>\n    </section>\n    <footer><p>2026 My Portfolio</p></footer>\n</body>\n</html>'),
        ('style.css', b'* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: system-ui; line-height: 1.6; color: #333; } nav { display: flex; justify-content: space-between; padding: 1rem 5%; background: #fff; position: fixed; width: 100%; box-shadow: 0 2px 10px rgba(0,0,0,0.1); } .logo { font-size: 1.5rem; font-weight: bold; color: #2563eb; } .links a { margin-left: 2rem; color: #333; text-decoration: none; } header { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-align: center; } header h1 { font-size: 4rem; } section { padding: 5rem 10%; } section h2 { font-size: 2.5rem; margin-bottom: 2rem; } .project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; } .project { background: #fff; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); } form { max-width: 500px; margin: 0 auto; } input, textarea { width: 100%; padding: 1rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 0.5rem; } button { background: #2563eb; color: #fff; padding: 1rem 2rem; border: none; border-radius: 0.5rem; cursor: pointer; } footer { background: #1e293b; color: #fff; text-align: center; padding: 2rem; }')
    ],
    'blog': [
        ('index.html', b'<!DOCTYPE html>\n<html>\n<head>\n    <title>My Blog</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <header>\n        <h1>My Blog</h1>\n        <p>Thoughts on development</p>\n    </header>\n    <main>\n        <article>\n            <h2>Getting Started with Web Development</h2>\n            <p class="meta">January 15, 2026</p>\n            <p>Web development is an exciting journey...</p>\n        </article>\n        <article>\n            <h2>The Power of JavaScript</h2>\n            <p class="meta">January 10, 2026</p>\n            <p>JavaScript is incredibly versatile...</p>\n        </article>\n    </main>\n    <aside>\n        <h3>About</h3>\n        <p>Welcome to my blog!</p>\n    </aside>\n    <footer><p>2026 My Blog</p></footer>\n</body>\n</html>'),
        ('style.css', b'* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: system-ui; max-width: 900px; margin: 0 auto; padding: 0 20px; } header { text-align: center; padding: 4rem 0; border-bottom: 1px solid #eee; } header h1 { font-size: 3rem; } main { margin-top: 3rem; } article { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; } article h2 { font-size: 1.8rem; color: #1e293b; } .meta { color: #94a3b8; font-size: 0.9rem; } aside { background: #f8fafc; padding: 2rem; border-radius: 1rem; margin-top: 3rem; } footer { text-align: center; padding: 3rem; color: #94a3b8; }')
    ],
    'voxel-game': [
        ('index.html', b'<!DOCTYPE html>\n<html>\n<head>\n    <title>Voxel World</title>\n    <script src="https://cdn.babylonjs.com/babylon.js"></script>\n    <style>\n        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; }\n        canvas { width: 100%; height: 100%; touch-action: none; }\n        #crosshair { position: absolute; top: 50%; left: 50%; width: 20px; height: 20px; transform: translate(-50%, -50%); pointer-events: none; color: white; font-size: 24px; font-family: monospace; text-shadow: 1px 1px 2px #000; }\n        #hud { position: absolute; top: 10px; left: 10px; color: white; font-family: monospace; font-size: 14px; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; }\n    </style>\n</head>\n<body>\n    <div id="crosshair">+</div>\n    <div id="hud">WASD: Move | SPACE: Jump | Left Click: Place | Right Click: Break | R: Reset</div>\n    <canvas id="renderCanvas"></canvas>\n    <script>\n        const canvas = document.getElementById("renderCanvas");\n        const engine = new BABYLON.Engine(canvas, true, { antialias: true });\n\n        const createScene = function() {\n            const scene = new BABYLON.Scene(engine);\n            scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.18);\n            scene.gravity = new BABYLON.Vector3(0, -0.5, 0);\n            scene.collisionsEnabled = true;\n\n            const camera = new BABYLON.UniversalCamera("player", new BABYLON.Vector3(0, 10, 0), scene);\n            camera.attachControl(canvas, true);\n            camera.speed = 0.5;\n            camera.inertia = 0.1;\n            camera.checkCollisions = true;\n            camera.applyGravity = false;\n            camera.ellipsoid = new BABYLON.Vector3(0.4, 0.8, 0.4);\n            camera.keysUp.push(87); camera.keysDown.push(83); camera.keysLeft.push(65); camera.keysRight.push(68);\n\n            let verticalVelocity = 0;\n            const gravity = 0.015;\n            const jumpForce = 0.35;\n            let isGrounded = false;\n            const playerHeight = 1.6;\n\n            const inputMap = {};\n            scene.actionManager = new BABYLON.ActionManager(scene);\n            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => inputMap[evt.sourceEvent.key.toLowerCase()] = true));\n            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => inputMap[evt.sourceEvent.key.toLowerCase()] = false));\n\n            const matNeon = new BABYLON.StandardMaterial("neon", scene);\n            matNeon.diffuseColor = new BABYLON.Color3(0, 1, 0.8);\n            matNeon.emissiveColor = new BABYLON.Color3(0, 0.5, 0.4);\n            matNeon.specularColor = BABYLON.Color3.Black();\n\n            const matPink = new BABYLON.StandardMaterial("pink", scene);\n            matPink.diffuseColor = new BABYLON.Color3(1, 0.2, 0.6);\n            matPink.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.3);\n            matPink.specularColor = BABYLON.Color3.Black();\n\n            const matPurple = new BABYLON.StandardMaterial("purple", scene);\n            matPurple.diffuseColor = new BABYLON.Color3(0.6, 0.2, 1);\n            matPurple.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.5);\n            matPurple.specularColor = BABYLON.Color3.Black();\n\n            const matOrange = new BABYLON.StandardMaterial("orange", scene);\n            matOrange.diffuseColor = new BABYLON.Color3(1, 0.5, 0);\n            matOrange.emissiveColor = new BABYLON.Color3(0.5, 0.25, 0);\n            matOrange.specularColor = BABYLON.Color3.Black();\n\n            const materials = [matNeon, matPink, matPurple, matOrange];\n            let selectedMat = 0;\n\n            const masterBox = BABYLON.MeshBuilder.CreateBox("box", {size: 1}, scene);\n            masterBox.isVisible = false;\n\n            const worldBlocks = new Map();\n            let blockId = 0;\n\n            function createBlock(x, y, z, mat) {\n                const key = x + "," + y + "," + z;\n                if (worldBlocks.has(key)) return;\n                const b = masterBox.clone("block" + blockId++);\n                b.position.set(x, y, z);\n                b.isVisible = true;\n                b.material = mat;\n                b.checkCollisions = true;\n                b.isBlock = true;\n                worldBlocks.set(key, b);\n            }\n\n            const SIZE = 12;\n            const GROUND = 5;\n            for (let x = -SIZE; x < SIZE; x++) {\n                for (let z = -SIZE; z < SIZE; z++) {\n                    createBlock(x, GROUND, z, matNeon);\n                    if (Math.random() > 0.7) createBlock(x, GROUND + 1, z, matPink);\n                }\n            }\n\n            const selectionBox = BABYLON.MeshBuilder.CreateBox("sel", {size: 1.01}, scene);\n            const matWire = new BABYLON.StandardMaterial("wire", scene);\n            matWire.wireframe = true;\n            matWire.emissiveColor = BABYLON.Color3.White();\n            selectionBox.material = matWire;\n            selectionBox.isPickable = false;\n            selectionBox.isVisible = false;\n\n            scene.registerBeforeRender(() => {\n                const ray = new BABYLON.Ray(camera.position, new BABYLON.Vector3(0, -1, 0), playerHeight + 0.1);\n                const pick = scene.pickWithRay(ray, (mesh) => mesh.isBlock);\n                if (pick.hit) { isGrounded = true; verticalVelocity = 0; if (camera.position.y < pick.pickedPoint.y + playerHeight) camera.position.y = pick.pickedPoint.y + playerHeight; }\n                else { isGrounded = false; verticalVelocity -= gravity; }\n                if (inputMap[" "] && isGrounded) { verticalVelocity = jumpForce; isGrounded = false; }\n                camera.position.y += verticalVelocity;\n                if (camera.position.y < -10) { camera.position.set(0, 10, 0); verticalVelocity = 0; }\n\n                const ray2 = camera.getForwardRay(5);\n                const hit = scene.pickWithRay(ray2, (m) => m.isBlock);\n                selectionBox.isVisible = hit.hit;\n                if (hit.hit) selectionBox.position = hit.pickedMesh.position;\n            });\n\n            scene.onPointerDown = (evt) => {\n                if (!document.pointerLockElement) { canvas.requestPointerLock(); return; }\n                const ray = camera.getForwardRay(5);\n                const hit = scene.pickWithRay(ray, (m) => m.isBlock);\n                if (hit.hit) {\n                    const mesh = hit.pickedMesh;\n                    if (evt.button === 2) {\n                        const key = mesh.position.x + "," + mesh.position.y + "," + mesh.position.z;\n                        worldBlocks.delete(key);\n                        mesh.dispose();\n                    } else if (evt.button === 0) {\n                        const normal = hit.getNormal(true);\n                        const pos = mesh.position.add(normal);\n                        if (BABYLON.Vector3.Distance(pos, camera.position) < 1.5) return;\n                        createBlock(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z), materials[selectedMat]);\n                    }\n                }\n            };\n\n            window.addEventListener("keydown", (e) => {\n                if (e.key === "r" || e.key === "R") { camera.position.set(0, 10, 0); verticalVelocity = 0; }\n                if (e.key >= "1" && e.key <= "4") { selectedMat = parseInt(e.key) - 1; }\n            });\n\n            new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.8;\n            new BABYLON.PointLight("pl", new BABYLON.Vector3(0, 10, 0), scene).intensity = 0.5;\n\n            return scene;\n        };\n\n        const scene = createScene();\n        engine.runRenderLoop(() => { scene.render(); });\n        window.addEventListener("resize", () => { engine.resize(); });\n    </script>\n</body>\n</html>')
    ],
}

@app.route('/explore')
def explore():
    projects = get_db().execute('''
        SELECT p.*, u.username as author, 'project' as type FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.is_on_explore = 1 
        ORDER BY p.likes_count DESC, p.created_at DESC
    ''').fetchall()
    games = get_db().execute('''
        SELECT g.*, u.username as author, 'game' as type FROM platformer_games g 
        JOIN users u ON g.user_id = u.id 
        WHERE g.is_on_explore = 1 
        ORDER BY g.created_at DESC
    ''').fetchall()
    return render_template('explore.html', projects=projects, games=games)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = get_db().execute('SELECT * FROM users WHERE username = ?', (request.form['username'],)).fetchone()
        if user and check_password_hash(user['password_hash'], request.form['password']):
            login_user(User(user['id'], user['username'], user['storage_used']))
            return redirect(url_for('dashboard'))
        flash('Invalid credentials', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            db = get_db()
            db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                       (request.form['username'], generate_password_hash(request.form['password'])))
            db.commit()
            user = db.execute('SELECT * FROM users WHERE username = ?', (request.form['username'],)).fetchone()
            login_user(User(user['id'], user['username'], user['storage_used']))
            return redirect(url_for('dashboard'))
        except Exception as e:
            if 'UNIQUE' in str(e) or 'unique' in str(e):
                flash('Username taken', 'error')
            else:
                flash(f'Error: {str(e)}', 'error')
    return render_template('register.html')

@app.route('/logout')
def logout(): logout_user(); return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    projects = get_db().execute('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', (current_user.id,)).fetchall()
    return render_template('dashboard/projects.html', projects=projects, section='projects')

@app.route('/dashboard/database')
@login_required
def dashboard_db():
    pid = request.args.get('project')
    projects = get_db().execute('SELECT id, name, project_uid FROM projects WHERE user_id = ?', (current_user.id,)).fetchall()
    data = []
    if pid:
        data = get_db().execute('SELECT * FROM kv_store WHERE project_id = ?', (pid,)).fetchall()
    return render_template('dashboard/database.html', projects=projects, data=data, selected_pid=int(pid) if pid else None, section='database')

@app.route('/api/database/<int:pid>/set', methods=['POST'])
@login_required
def db_set(pid):
    project = get_db().execute('SELECT id FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id)).fetchone()
    if not project: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    key, value = data.get('key'), data.get('value', '')
    if not key: return jsonify({'error': 'Key required'}), 400
    db = get_db()
    db.execute('INSERT OR REPLACE INTO kv_store (project_id, key_name, value) VALUES (?, ?, ?)', (pid, key, value))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/database/<int:pid>/delete', methods=['POST'])
@login_required
def db_delete(pid):
    project = get_db().execute('SELECT id FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id)).fetchone()
    if not project: return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    key = data.get('key')
    if not key: return jsonify({'error': 'Key required'}), 400
    db = get_db()
    db.execute('DELETE FROM kv_store WHERE project_id = ? AND key_name = ?', (pid, key))
    db.commit()
    return jsonify({'success': True})

@app.route('/dashboard/plugins', methods=['GET', 'POST'])
@login_required
def dashboard_plugins():
    if request.method == 'POST':
        get_db().execute('INSERT INTO plugins (user_id, name, description, image_url, category, js_code) VALUES (?, ?, ?, ?, ?, ?)', 
                         (current_user.id, request.form['name'], request.form.get('description', ''), 
                          request.form.get('image_url', ''), request.form.get('category', 'utility'), request.form['code']))
        get_db().commit()
    plugins = get_db().execute('SELECT * FROM plugins WHERE user_id = ?', (current_user.id,)).fetchall()
    return render_template('dashboard/plugins.html', plugins=plugins, section='plugins')

# ===== VISUAL GAME BUILDERS =====
@app.route('/dashboard/game-builder')
@login_required
def game_builder():
    return render_template('dashboard/game_builder.html', section='games')

# ===== GDEVELOP GAME BUILDER =====
@app.route('/dashboard/platformer-builder')
@login_required
def platformer_builder():
    game_id = request.args.get('id')
    game_data = None
    if game_id:
        game = get_db().execute('SELECT * FROM platformer_games WHERE id = ? AND user_id = ?', (game_id, current_user.id)).fetchone()
        if game: game_data = game['game_data']
    return render_template('dashboard/platformer_builder.html', section='games', game_data=game_data, game_id=game_id)

@app.route('/api/platformer/save', methods=['POST'])
@login_required
def save_platformer():
    data = request.get_json()
    db = get_db()
    
    # Check if updating existing
    game_id = data.get('id')
    name = data.get('title', 'Untitled Platformer')
    game_json = json.dumps(data)
    
    if game_id:
        db.execute('UPDATE platformer_games SET name = ?, game_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                   (name, game_json, game_id, current_user.id))
        db.commit()
        return jsonify({'success': True, 'id': game_id})
    else:
        uid = secrets.token_urlsafe(8)
        db.execute('INSERT INTO platformer_games (user_id, uid, name, game_data) VALUES (?, ?, ?, ?)',
                   (current_user.id, uid, name, game_json))
        db.commit()
        new_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        return jsonify({'success': True, 'id': new_id})

@app.route('/api/platformer/<int:gid>/publish', methods=['POST'])
@login_required
def publish_platformer(gid):
    db = get_db()
    action = request.json.get('action', 'publish') # publish or unpublish
    db.execute('UPDATE platformer_games SET is_on_explore = ? WHERE id = ? AND user_id = ?', 
               (1 if action == 'publish' else 0, gid, current_user.id))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/platformer/<int:gid>/delete', methods=['POST'])
@login_required
def delete_platformer(gid):
    get_db().execute('DELETE FROM platformer_games WHERE id = ? AND user_id = ?', (gid, current_user.id))
    get_db().commit()
    return jsonify({'success': True})

# ===== MELONJS GAME ENGINE =====
@app.route('/melon-games')
@login_required
def melon_games():
    """MelonJS game engine - list all games"""
    games = get_db().execute('SELECT * FROM melon_games WHERE user_id = ? ORDER BY updated_at DESC', (current_user.id,)).fetchall()
    return render_template('dashboard/melon_games.html', games=games, section='melon-games')

@app.route('/melon-games/new')
@login_required
def melon_game_new():
    """Create a new MelonJS game"""
    return render_template('dashboard/melon_editor.html', game=None, section='melon-games')

@app.route('/melon-games/<int:game_id>')
@login_required
def melon_game_edit(game_id):
    """Edit an existing MelonJS game"""
    game = get_db().execute('SELECT * FROM melon_games WHERE id = ? AND user_id = ?', (game_id, current_user.id)).fetchone()
    if not game: return redirect('/melon-games')
    return render_template('dashboard/melon_editor.html', game=game, section='melon-games')

@app.route('/melon-games/play/<int:game_id>')
def melon_game_play(game_id):
    """Play a MelonJS game"""
    game = get_db().execute('SELECT * FROM melon_games WHERE id = ?', (game_id,)).fetchone()
    if not game: return "Game not found", 404
    return render_template('melon_game_player.html', game=game)

@app.route('/api/melon-games/save', methods=['POST'])
@login_required
def save_melon_game():
    """Save a MelonJS game"""
    data = request.get_json()
    db = get_db()
    game_id = data.get('id')
    name = data.get('name', 'Untitled Game')
    game_data = json.dumps(data.get('gameData', {}))
    
    if game_id:
        db.execute('UPDATE melon_games SET name = ?, game_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                   (name, game_data, game_id, current_user.id))
        db.commit()
        return jsonify({'success': True, 'id': game_id})
    else:
        uid = secrets.token_urlsafe(8)
        db.execute('INSERT INTO melon_games (user_id, uid, name, game_data) VALUES (?, ?, ?, ?)',
                   (current_user.id, uid, name, game_data))
        db.commit()
        new_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        return jsonify({'success': True, 'id': new_id})

@app.route('/api/melon-games/<int:game_id>/delete', methods=['POST'])
@login_required
def delete_melon_game(game_id):
    """Delete a MelonJS game"""
    get_db().execute('DELETE FROM melon_games WHERE id = ? AND user_id = ?', (game_id, current_user.id))
    get_db().commit()
    return jsonify({'success': True})

@app.route('/api/melon-games/<int:game_id>/export', methods=['POST'])
@login_required
def export_melon_game(game_id):
    """Export a MelonJS game as HTML"""
    game = get_db().execute('SELECT * FROM melon_games WHERE id = ? AND user_id = ?', (game_id, current_user.id)).fetchone()
    if not game: return jsonify({'error': 'Game not found'}), 404
    
    data = request.get_json()
    format = data.get('format', 'html')  # html, zip
    
    game_data = json.loads(game['game_data']) if game['game_data'] else {}
    
    # Generate HTML export
    html_content = generate_melonjs_export(game['name'], game_data)
    
    if format == 'zip':
        import zipfile
        import io
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as zf:
            zf.writestr('index.html', html_content)
            # Add sprites if any
            if 'sprites' in game_data:
                for sprite_name, sprite_data in game_data['sprites'].items():
                    if sprite_data.get('data'):
                        zf.writestr(f'sprites/{sprite_name}.png', base64.b64decode(sprite_data['data']))
        buffer.seek(0)
        return Response(
            buffer.getvalue(),
            mimetype='application/zip',
            headers={'Content-Disposition': f'attachment; filename={game["name"].replace(" ", "_")}.zip'}
        )
    else:
        return html_content

def generate_melonjs_export(game_name, game_data):
    """Generate a complete HTML file with MelonJS game"""
    width = game_data.get('width', 800)
    height = game_data.get('height', 600)
    
    # Generate game entities
    entities_js = []
    for entity in game_data.get('entities', []):
        x = entity.get('x', 0)
        y = entity.get('y', 0)
        w = entity.get('width', 32)
        h = entity.get('height', 32)
        color = entity.get('color', '#ff0000')
        entity_type = entity.get('type', 'rectangle')
        
        if entity_type == 'rectangle':
            entities_js.append(f"""
        // {entity.get('name', 'Rectangle')}
        me.Entity.extend(
            "{name}",
            {{
                init: function(x, y) {{
                    this._super(me.Entity, "init", [x, y, {{
                        width: {w},
                        height: {h},
                        shape: new me.Rectangle(0, 0, {w}, {h})
                    }}]);
                    this.renderable = new me.ColorLayer("{name}", "{color}").render();
                }}
            }}
        );
        new me.Entity({x}, {y}, {{name: "{name}"}});
            """)
        elif entity_type == 'sprite':
            sprite_name = entity.get('spriteName', 'player')
            entities_js.append(f"""
        // Sprite: {entity.get('name', 'Sprite')}
        me.Entity.extend(
            "{name}",
            {{
                init: function(x, y) {{
                    this._super(me.Entity, "init", [x, y, {{
                        width: {w},
                        height: {h},
                        shape: new me.Rectangle(0, 0, {w}, {h})
                    }}]);
                    // Sprite rendering
                }}
            }}
        );
        new me.Entity({x}, {y}, {{name: "{name}"}});
            """)
    
    entities_code = '\n'.join(entities_js) if entities_js else "// Add entities in the editor"
    
    html = f'''<!DOCTYPE html>
<html>
<head>
    <title>{game_name}</title>
    <script src="https://cdn.jsdelivr.net/npm/melonjs@8.3.0/build/melonjs.min.js"></script>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background: #1a1a2e;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: system-ui, sans-serif;
        }}
        #game-container {{
            border: 4px solid #fff;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }}
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script>
    // Game Configuration
    var gameConfig = {{
        width: {width},
        height: {height},
        parent: "game-container",
        renderer: me.AUTO,
        preferWebGL1: true
    }};

    // Initialize game
    me.game = new me.Game(0, 0, gameConfig);

    // Game Title
    me.game.addComponent(new (me.GUI.extend({{
        init: function() {{
            this._super(me.GUI, "init");
            this.font = new me.Font("Arial", 20, "#fff");
        }},
        draw: function(context) {{
            this.font.draw(context, "{game_name}", 10, 10);
        }}
    }})));

    // Add game entities
    {entities_code}

    // Start the game
    me.boot();
    </script>
</body>
</html>'''
    return html


# ===== MY GAMES DASHBOARD =====
@app.route('/dashboard/games')
@login_required
def dashboard_games():
    # Fetch Platformer Games
    platformers = get_db().execute('SELECT * FROM platformer_games WHERE user_id = ? ORDER BY updated_at DESC', (current_user.id,)).fetchall()
    
    # Fetch Block Games (Projects with blocks.json)
    block_games = get_db().execute('''
        SELECT p.* FROM projects p
        JOIN files f ON p.id = f.project_id
        WHERE p.user_id = ? AND f.filepath = 'blocks.json'
        ORDER BY p.updated_at DESC
    ''', (current_user.id,)).fetchall()
    
    return render_template('dashboard/my_games.html', platformers=platformers, block_games=block_games, section='games')

@app.route('/dashboard/gdevelop')
@login_required
def gdevelop_new():
    return render_template('dashboard/gdevelop.html', game=None, section='games')

@app.route('/dashboard/gdevelop/<int:game_id>')
@login_required
def gdevelop_edit(game_id):
    game = get_db().execute('SELECT * FROM gdevelop_games WHERE id = ? AND user_id = ?', (game_id, current_user.id)).fetchone()
    if not game: return redirect('/dashboard/games')
    return render_template('dashboard/gdevelop.html', game=game, section='games')

@app.route('/api/gdevelop-games/save', methods=['POST'])
@login_required
def save_gdevelop_game():
    data = request.get_json()
    db = get_db()
    game_id = data.get('id')
    name = data.get('name', 'Untitled Game')
    description = data.get('description', '')
    
    if game_id:
        db.execute('UPDATE gdevelop_games SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                   (name, description, game_id, current_user.id))
        db.commit()
        return jsonify({'success': True, 'id': game_id})
    else:
        uid = secrets.token_urlsafe(8)
        db.execute('INSERT INTO gdevelop_games (user_id, name, description, uid) VALUES (?, ?, ?, ?)',
                   (current_user.id, name, description, uid))
        db.commit()
        new_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        return jsonify({'success': True, 'id': new_id})

@app.route('/api/gdevelop-games/<int:game_id>/delete', methods=['POST'])
@login_required
def delete_gdevelop_game(game_id):
    get_db().execute('DELETE FROM gdevelop_games WHERE id = ? AND user_id = ?', (game_id, current_user.id))
    get_db().commit()
    return jsonify({'success': True})

@app.route('/api/gdevelop-games/<int:game_id>/publish', methods=['POST'])
@login_required
def publish_gdevelop_game(game_id):
    db = get_db()
    game = db.execute('SELECT * FROM gdevelop_games WHERE id = ? AND user_id = ?', (game_id, current_user.id)).fetchone()
    if not game: return jsonify({'error': 'Game not found'}), 404
    db.execute('UPDATE gdevelop_games SET is_on_explore = 1 WHERE id = ?', (game_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/plugin/<int:plugin_id>/delete', methods=['POST'])
@login_required
def delete_plugin(plugin_id):
    get_db().execute('DELETE FROM plugins WHERE id = ? AND user_id = ?', (plugin_id, current_user.id))
    get_db().commit()
    return jsonify({'success': True})

@app.route('/api/plugin/<int:plugin_id>/toggle', methods=['POST'])
@login_required
def toggle_plugin(plugin_id):
    db = get_db()
    plugin = db.execute('SELECT is_active FROM plugins WHERE id = ? AND user_id = ?', (plugin_id, current_user.id)).fetchone()
    if plugin:
        new_status = 0 if plugin['is_active'] else 1
        db.execute('UPDATE plugins SET is_active = ? WHERE id = ?', (new_status, plugin_id))
        db.commit()
        return jsonify({'success': True, 'is_active': new_status})
    return jsonify({'success': False}), 404

@app.route('/api/plugin/<int:plugin_id>')
@login_required
def get_plugin(plugin_id):
    plugin = get_db().execute('SELECT * FROM plugins WHERE id = ? AND user_id = ?', (plugin_id, current_user.id)).fetchone()
    if not plugin: return jsonify({'error': 'Not found'}), 404
    return jsonify({
        'id': plugin['id'], 'name': plugin['name'], 'description': plugin['description'] or '',
        'image_url': plugin['image_url'] or '', 'category': plugin['category'] or 'utility', 'code': plugin['js_code']
    })

@app.route('/api/plugin/<int:plugin_id>/update', methods=['POST'])
@login_required
def update_plugin(plugin_id):
    db = get_db()
    plugin = db.execute('SELECT id FROM plugins WHERE id = ? AND user_id = ?', (plugin_id, current_user.id)).fetchone()
    if not plugin: return jsonify({'error': 'Not found'}), 404
    data = request.json
    db.execute('''UPDATE plugins SET name = ?, description = ?, image_url = ?, category = ?, js_code = ? WHERE id = ?''',
               (data.get('name'), data.get('description', ''), data.get('image_url', ''), data.get('category', 'utility'), data.get('code'), plugin_id))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/plugin/<int:plugin_id>/share', methods=['POST'])
@login_required
def share_plugin(plugin_id):
    db = get_db()
    plugin = db.execute('SELECT is_public FROM plugins WHERE id = ? AND user_id = ?', (plugin_id, current_user.id)).fetchone()
    if plugin:
        new_status = 0 if plugin['is_public'] else 1
        db.execute('UPDATE plugins SET is_public = ? WHERE id = ?', (new_status, plugin_id))
        db.commit()
        return jsonify({'success': True, 'is_public': new_status})
    return jsonify({'success': False}), 404

@app.route('/api/plugin/<int:plugin_id>/install', methods=['POST'])
@login_required
def install_plugin(plugin_id):
    db = get_db()
    plugin = db.execute('SELECT * FROM plugins WHERE id = ? AND is_public = 1', (plugin_id,)).fetchone()
    if not plugin: return jsonify({'success': False, 'error': 'Plugin not found'}), 404
    # Check if already installed
    existing = db.execute('SELECT id FROM plugins WHERE user_id = ? AND name = ?', (current_user.id, plugin['name'])).fetchone()
    if existing: return jsonify({'success': False, 'error': 'Plugin already installed'})
    # Copy plugin to user
    db.execute('INSERT INTO plugins (user_id, name, description, image_url, category, js_code, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
               (current_user.id, plugin['name'], plugin['description'], plugin['image_url'], plugin['category'], plugin['js_code']))
    # Increment install count
    db.execute('UPDATE plugins SET install_count = install_count + 1 WHERE id = ?', (plugin_id,))
    db.commit()
    return jsonify({'success': True})

@app.route('/marketplace')
def marketplace():
    plugins = get_db().execute('''
        SELECT p.*, u.username as author FROM plugins p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.is_public = 1 
        ORDER BY p.install_count DESC
    ''').fetchall()
    templates = get_db().execute('''
        SELECT p.id, p.project_uid as uid, p.name, p.description, u.username as author, 
               (SELECT COUNT(*) FROM projects WHERE remixed_from = p.project_uid) as remix_count
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.is_template = 1 
        ORDER BY p.created_at DESC
    ''').fetchall()
    return render_template('marketplace.html', plugins=plugins, templates=templates)

@app.route('/api/plugin/<int:plugin_id>/source')
def view_plugin_source(plugin_id):
    plugin = get_db().execute('SELECT name, js_code, description FROM plugins WHERE id = ? AND is_public = 1', (plugin_id,)).fetchone()
    if not plugin: return jsonify({'error': 'Not found'}), 404
    return jsonify({'name': plugin['name'], 'code': plugin['js_code'], 'description': plugin['description']})

@app.route('/api/template/<uid>/source')
def view_template_source(uid):
    db = get_db()
    project = db.execute('SELECT id, name, description FROM projects WHERE project_uid = ? AND is_template = 1', (uid,)).fetchone()
    if not project: return jsonify({'error': 'Not found'}), 404
    files = db.execute('SELECT filepath, content FROM files WHERE project_id = ? AND is_asset = 0', (project['id'],)).fetchall()
    return jsonify({
        'name': project['name'],
        'description': project['description'],
        'files': [{'name': f['filepath'], 'content': f['content'].decode('utf-8') if isinstance(f['content'], bytes) else f['content']} for f in files]
    })

@app.route('/api/template/<uid>/remix', methods=['POST'])
@login_required
def remix_template(uid):
    db = get_db()
    source = db.execute('SELECT id, name FROM projects WHERE project_uid = ?', (uid,)).fetchone()
    if not source: return jsonify({'error': 'Template not found'}), 404
    
    data = request.get_json()
    name = data.get('name', source['name'] + ' Remix')
    new_uid = secrets.token_urlsafe(8)
    
    db.execute('INSERT INTO projects (user_id, name, project_uid, remixed_from) VALUES (?, ?, ?, ?)',
               (current_user.id, name, new_uid, uid))
    new_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
    
    files = db.execute('SELECT filepath, content, is_asset FROM files WHERE project_id = ?', (source['id'],)).fetchall()
    for f in files:
        db.execute('INSERT INTO files (project_id, filepath, content, is_asset) VALUES (?, ?, ?, ?)',
                   (new_id, f['filepath'], f['content'], f['is_asset']))
    db.commit()
    return jsonify({'success': True, 'project_id': new_id})

@app.route('/api/project/<int:pid>/share-template', methods=['POST'])
@login_required
def share_as_template(pid):
    db = get_db()
    project = db.execute('SELECT * FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id)).fetchone()
    if not project: return jsonify({'error': 'Not found'}), 404
    
    data = request.get_json()
    description = data.get('description', '')
    db.execute('UPDATE projects SET is_template = 1, description = ? WHERE id = ?', (description, pid))
    db.commit()
    return jsonify({'success': True})

# ===== OFFICIAL PLUGINS =====
OFFICIAL_PLUGINS = {
    'image_editor': {
        'name': 'Image Editor',
        'description': 'Built-in image previewer and editor. View, crop, rotate, resize, and apply filters to images. Uses the powerful TUI Image Editor library.',
        'category': 'utility',
        'code': r'''// ========== IMAGE EDITOR PLUGIN ==========
// Uses TUI Image Editor (Toast UI) - Open Source

(function() {
    // Add CSS for TUI Image Editor
    const tuiCSS = document.createElement('link');
    tuiCSS.rel = 'stylesheet';
    tuiCSS.href = 'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.css';
    document.head.appendChild(tuiCSS);

    // Add TUI Image Editor script
    const tuiScript = document.createElement('script');
    tuiScript.src = 'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.js';
    document.head.appendChild(tuiScript);

    // Add button to header
    const header = document.querySelector('header');
    if (!header) return;

    const editorBtn = document.createElement('button');
    editorBtn.innerHTML = '🖼️ Image Editor';
    editorBtn.style.cssText = 'background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;margin-right:10px;font-size:13px;';
    header.querySelector('div:last-child').prepend(editorBtn);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'image-editor-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;';
    modal.innerHTML = `
        <div style="position:absolute;inset:20px;background:#1e1e1e;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#2d2d2d;border-bottom:1px solid #404040;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:20px;">🖼️</span>
                    <span style="color:white;font-weight:bold;font-size:16px;">Image Editor</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <label style="background:#3b82f6;color:white;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:13px;">
                        📂 Open Image
                        <input type="file" accept="image/*" id="ie-file-input" style="display:none;">
                    </label>
                    <button id="ie-download" style="background:#22c55e;color:white;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:13px;">💾 Download</button>
                    <button id="ie-close" style="background:#ef4444;color:white;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:13px;">✕ Close</button>
                </div>
            </div>
            <div id="tui-editor-container" style="flex:1;"></div>
        </div>
    `;
    document.body.appendChild(modal);

    let imageEditor = null;

    function initEditor(imageSrc) {
        if (typeof tui === 'undefined' || !tui.ImageEditor) {
            alert('Image Editor is still loading... Please try again in a moment.');
            return;
        }

        const container = document.getElementById('tui-editor-container');
        container.innerHTML = '';

        imageEditor = new tui.ImageEditor(container, {
            includeUI: {
                loadImage: { path: imageSrc, name: 'image' },
                theme: {
                    'common.bi.image': '',
                    'common.bisize.width': '0',
                    'common.bisize.height': '0',
                    'common.backgroundColor': '#1e1e1e',
                    'header.backgroundColor': '#1e1e1e',
                    'menu.backgroundColor': '#2d2d2d',
                    'submenu.backgroundColor': '#2d2d2d'
                },
                menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter'],
                initMenu: 'filter',
                uiSize: { width: '100%', height: '100%' },
                menuBarPosition: 'left'
            },
            cssMaxWidth: 1200,
            cssMaxHeight: 800,
            usageStatistics: false
        });
    }

    // Open button click
    editorBtn.onclick = () => {
        modal.style.display = 'block';
        // If no image loaded, show placeholder
        if (!imageEditor) {
            const container = document.getElementById('tui-editor-container');
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#888;">
                    <span style="font-size:80px;margin-bottom:20px;">🖼️</span>
                    <p style="font-size:18px;font-weight:bold;">Click "Open Image" to start editing</p>
                    <p style="font-size:14px;margin-top:8px;">Supports JPG, PNG, GIF, WebP</p>
                </div>
            `;
        }
    };

    // File input
    document.getElementById('ie-file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => initEditor(evt.target.result);
        reader.readAsDataURL(file);
    };

    // Download
    document.getElementById('ie-download').onclick = () => {
        if (!imageEditor) { alert('No image loaded!'); return; }
        const dataURL = imageEditor.toDataURL();
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = dataURL;
        link.click();
    };

    // Close
    document.getElementById('ie-close').onclick = () => {
        modal.style.display = 'none';
    };

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    console.log('🖼️ Image Editor plugin loaded!');
})();
'''
    },
    'sketchfab_models': {
        'name': 'Sketchfab 3D Models',
        'description': 'Browse and preview 3D models from Sketchfab. Search millions of models, preview them in the viewer, and get model URLs for your projects.',
        'category': '3d',
        'code': r'''// ========== SKETCHFAB 3D MODELS PLUGIN ==========
(function() {
    // Add Sketchfab Viewer API
    const sfScript = document.createElement('script');
    sfScript.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    document.head.appendChild(sfScript);

    // Add 3D Models tab to sidebar
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;

    // Find tabs container or create one
    let tabsContainer = sidebar.querySelector('.tabs-container');
    if (!tabsContainer) {
        const firstChild = sidebar.firstElementChild;
        tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        tabsContainer.style.cssText = 'display:flex;border-bottom:1px solid #e5e7eb;';
        tabsContainer.innerHTML = `
            <button class="sf-tab active" data-tab="files" style="flex:1;padding:8px;border:none;background:#fff;font-weight:bold;font-size:11px;cursor:pointer;border-bottom:2px solid #3b82f6;">Files</button>
            <button class="sf-tab" data-tab="assets" style="flex:1;padding:8px;border:none;background:#f8fafc;font-weight:bold;font-size:11px;cursor:pointer;color:#64748b;">Assets</button>
            <button class="sf-tab" data-tab="3d" style="flex:1;padding:8px;border:none;background:#f8fafc;font-weight:bold;font-size:11px;cursor:pointer;color:#64748b;">3D</button>
        `;
        sidebar.insertBefore(tabsContainer, firstChild);
    }

    // Create 3D models panel
    const modelsPanel = document.createElement('div');
    modelsPanel.id = 'sf-models-panel';
    modelsPanel.style.cssText = 'display:none;flex-direction:column;height:100%;';
    modelsPanel.innerHTML = `
        <div style="padding:12px;border-bottom:1px solid #e5e7eb;">
            <input type="text" id="sf-search" placeholder="Search 3D models..." style="width:100%;padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;">
        </div>
        <div id="sf-results" style="flex:1;overflow-y:auto;padding:8px;"></div>
        <div id="sf-preview" style="display:none;height:250px;background:#1a1a2e;border-top:1px solid #e5e7eb;">
            <iframe id="sf-viewer" src="" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen; xr-spatial-tracking"></iframe>
        </div>
    `;
    sidebar.appendChild(modelsPanel);

    // Tab switching
    document.querySelectorAll('.sf-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.sf-tab').forEach(t => {
                t.classList.remove('active');
                t.style.background = '#f8fafc';
                t.style.color = '#64748b';
                t.style.borderBottom = 'none';
            });
            tab.classList.add('active');
            tab.style.background = '#fff';
            tab.style.color = '#000';
            tab.style.borderBottom = '2px solid #3b82f6';
            
            const tabName = tab.dataset.tab;
            document.getElementById('file-list')?.style && (document.getElementById('file-list').style.display = tabName === 'files' ? 'block' : 'none');
            document.getElementById('asset-grid')?.style && (document.getElementById('asset-grid').style.display = tabName === 'assets' ? 'grid' : 'none');
            modelsPanel.style.display = tabName === '3d' ? 'flex' : 'none';
        };
    });

    // Search functionality
    let searchTimeout;
    document.getElementById('sf-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchModels(e.target.value), 500);
    });

    async function searchModels(query) {
        if (!query) {
            document.getElementById('sf-results').innerHTML = '<p style="text-align:center;color:#888;padding:20px;font-size:12px;">Enter a search term to find 3D models</p>';
            return;
        }
        
        document.getElementById('sf-results').innerHTML = '<p style="text-align:center;padding:20px;font-size:12px;">Searching...</p>';
        
        try {
            // Use Sketchfab API to search
            const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(query)}&downloadable=true`);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                displayResults(data.results);
            } else {
                document.getElementById('sf-results').innerHTML = '<p style="text-align:center;color:#888;padding:20px;font-size:12px;">No models found</p>';
            }
        } catch (err) {
            document.getElementById('sf-results').innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;font-size:12px;">Search failed. Try again.</p>';
        }
    }

    function displayResults(models) {
        const container = document.getElementById('sf-results');
        container.innerHTML = models.slice(0, 20).map(m => `
            <div class="sf-model" data-uid="${m.uid}" style="background:#f8fafc;border-radius:8px;margin-bottom:8px;overflow:hidden;cursor:pointer;transition:box-shadow 0.2s;">
                <img src="${m.thumbnails.images[0]?.url || ''}" style="width:100%;height:80px;object-fit:cover;">
                <div style="padding:8px;">
                    <div style="font-size:11px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</div>
                    <div style="font-size:10px;color:#888;">by ${m.user.displayName}</div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.sf-model').forEach(el => {
            el.onclick = () => previewModel(el.dataset.uid);
            el.onmouseenter = () => el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            el.onmouseleave = () => el.style.boxShadow = 'none';
        });
    }

    function previewModel(uid) {
        const preview = document.getElementById('sf-preview');
        preview.style.display = 'block';
        
        const iframe = document.getElementById('sf-viewer');
        
        if (typeof Sketchfab === 'undefined') {
            iframe.src = `https://sketchfab.com/models/${uid}/embed?autostart=1&ui_infos=0&ui_controls=1`;
            return;
        }
        
        const client = new Sketchfab(iframe);
        client.init(uid, {
            success: (api) => {
                api.start();
                api.addEventListener('viewerready', () => console.log('Sketchfab viewer ready'));
            },
            error: () => {
                iframe.src = `https://sketchfab.com/models/${uid}/embed?autostart=1&ui_infos=0&ui_controls=1`;
            }
        });
    }

    // Initial state
    document.getElementById('sf-results').innerHTML = '<p style="text-align:center;color:#888;padding:20px;font-size:12px;">Search for 3D models from Sketchfab</p>';

    console.log('🎮 Sketchfab 3D Models plugin loaded!');
})();
'''
    },
    'block_editor': {
        'name': 'Visual Block Editor',
        'description': 'Drag-and-drop visual code blocks that generate JavaScript game code. Perfect for beginners!',
        'category': 'editor',
        'code': r'''// ========== VISUAL BLOCK EDITOR ==========
(function() {
    const checkBlocks = async () => {
        try {
            const files = window.FILES || {};
            // Also enable for Phaser games if user wants blocks
            if (!files['blocks.json'] && !files['game.js']) return; 
            
            // Add Blocks tab
            const tabs = document.querySelector('.sidebar-tabs') || document.querySelector('[class*="tab"]');
            if (!tabs) return;
            if (document.getElementById('blocks-tab')) return;

            const blocksTab = document.createElement('button');
            blocksTab.className = 'sidebar-tab';
            blocksTab.id = 'blocks-tab';
            blocksTab.innerHTML = '<i class="fas fa-puzzle-piece"></i> Blocks';
            blocksTab.style.cssText = 'padding:8px 16px;border:none;background:#7c3aed;color:white;font-weight:bold;border-radius:8px;cursor:pointer;margin-left:8px;';
            tabs.appendChild(blocksTab);
            
            // CSS for blocks
            const style = document.createElement('style');
            style.textContent = `
                .block-cat { font-weight:bold; font-size:11px; margin:12px 0 6px 0; text-transform:uppercase; padding-left:4px; }
                .block-cat.motion { color: #4c97ff; }
                .block-cat.looks { color: #9966ff; }
                .block-cat.events { color: #ffbf00; }
                .block-cat.control { color: #ffab19; }
                .block-cat.sensing { color: #5cb1d6; }
                .block-cat.operators { color: #59c059; }
                .block-btn {
                    display:block; width:100%; text-align:left; padding:6px 10px; margin-bottom:4px;
                    border:none; border-radius:4px; color:white; font-family:sans-serif; font-size:12px; font-weight:bold;
                    cursor:grab; position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.2);
                }
                .block-btn:before { content:''; position:absolute; top:4px; left:4px; width:0; height:0; border-style:solid; border-width:4px 0 4px 5px; border-color:transparent transparent transparent rgba(0,0,0,0.2); display:none; }
                .b-motion { background: #4c97ff; border:1px solid #3373cc; }
                .b-looks { background: #9966ff; border:1px solid #774dcb; }
                .b-events { background: #ffbf00; border:1px solid #cc9900; }
                .b-control { background: #ffab19; border:1px solid #cf8b17; }
                .b-sensing { background: #5cb1d6; border:1px solid #2e8eb8; }
                .b-operators { background: #59c059; border:1px solid #389438; }
                .block-input { background:white; border-radius:10px; padding:0 6px; color:black; font-weight:normal; display:inline-block; min-width:20px; text-align:center; }
            `;
            document.head.appendChild(style);

            // Create panel
            const panel = document.createElement('div');
            panel.id = 'blocks-panel';
            panel.style.cssText = 'position:absolute; top:60px; left:0; width:260px; height:calc(100% - 60px); background:#f9f9f9; z-index:100; border-right:1px solid #e2e8f0; display:none; overflow-y:auto; padding:12px; box-shadow:4px 0 10px rgba(0,0,0,0.05);';
            
            // Block Definitions
            const blocks = {
                events: [
                    { label: 'When Game Starts', code: '// When game starts\ncreate() {\n  \n}' },
                    { label: 'Every Frame', code: 'update() {\n  \n}' },
                    { label: 'When Space Pressed', code: 'if (this.cursors.space.isDown) {\n  \n}' },
                    { label: 'On Click', code: 'this.input.on("pointerdown", function (pointer) {\n  \n});' }
                ],
                motion: [
                    { label: 'Move Steps', code: 'player.x += 10;' },
                    { label: 'Turn Right', code: 'player.angle += 15;' },
                    { label: 'Go to X:0 Y:0', code: 'player.setPosition(0, 0);' },
                    { label: 'Set Velocity X', code: 'player.setVelocityX(160);' },
                    { label: 'Set Velocity Y', code: 'player.setVelocityY(-330);' },
                    { label: 'Bounce on Walls', code: 'player.setCollideWorldBounds(true);' }
                ],
                looks: [
                    { label: 'Set Tint Color', code: 'player.setTint(0xff0000);' },
                    { label: 'Set Scale 200%', code: 'player.setScale(2);' },
                    { label: 'Set Alpha 50%', code: 'player.setAlpha(0.5);' },
                    { label: 'Visible True', code: 'player.setVisible(true);' },
                    { label: 'Play Anim', code: 'player.anims.play("walk", true);' }
                ],
                control: [
                    { label: 'Wait 1 sec', code: 'setTimeout(() => {\n  \n}, 1000);' },
                    { label: 'Repeat 10', code: 'for(let i=0; i<10; i++) {\n  \n}' },
                    { label: 'If Then', code: 'if (condition) {\n  \n}' },
                    { label: 'If Else', code: 'if (condition) {\n  \n} else {\n  \n}' }
                ],
                sensing: [
                    { label: 'Touching Object?', code: 'this.physics.overlap(player, object)' },
                    { label: 'Key Pressed?', code: 'this.cursors.left.isDown' },
                    { label: 'Mouse X', code: 'this.input.x' },
                    { label: 'Mouse Y', code: 'this.input.y' }
                ],
                operators: [
                    { label: 'Random 1-10', code: 'Phaser.Math.Between(1, 10)' },
                    { label: 'Dist to Mouse', code: 'Phaser.Math.Distance.Between(player.x, player.y, this.input.x, this.input.y)' },
                    { label: 'Plus', code: 'a + b' },
                    { label: 'Greater Than', code: 'a > b' }
                ]
            };

            let html = '<h3 style="margin-top:0;">Blocks</h3><p style="font-size:11px;color:#666;margin-bottom:10px;">Drag code to editor!</p>';
            for(let cat in blocks) {
                html += `<div class="block-cat ${cat}">${cat}</div>`;
                blocks[cat].forEach(b => {
                    html += `<div class="block-btn b-${cat}" draggable="true" data-code="${b.code.replace(/"/g, '&quot;')}">${b.label}</div>`;
                });
            }
            panel.innerHTML = html;
            document.body.appendChild(panel);

            // Drag Events
            panel.querySelectorAll('.block-btn').forEach(b => {
                b.ondragstart = e => e.dataTransfer.setData('text/plain', b.dataset.code);
            });

            // Tab Click
            blocksTab.onclick = () => {
                const isHidden = panel.style.display === 'none';
                panel.style.display = isHidden ? 'block' : 'none';
                // Toggle file panel
                const fp = document.querySelector('.file-panel') || document.querySelector('.files-list');
                if(fp) fp.style.display = isHidden ? 'none' : 'block';
            };
            
            console.log('🧩 Block Editor Loaded');
        } catch(e) { console.error(e); }
    };
    setTimeout(checkBlocks, 1500);
})();
'''
    }
}

@app.route('/api/official-plugin/<plugin_id>')
def get_official_plugin(plugin_id):
    plugin = OFFICIAL_PLUGINS.get(plugin_id)
    if not plugin: return jsonify({'error': 'Not found'}), 404
    return jsonify(plugin)

@app.route('/api/official-plugin/<plugin_id>/install', methods=['POST'])
@login_required
def install_official_plugin(plugin_id):
    plugin = OFFICIAL_PLUGINS.get(plugin_id)
    if not plugin: return jsonify({'error': 'Plugin not found'}), 404
    db = get_db()
    # Check if already installed
    existing = db.execute('SELECT id FROM plugins WHERE user_id = ? AND name = ?', (current_user.id, plugin['name'])).fetchone()
    if existing: return jsonify({'success': False, 'error': 'Plugin already installed'})
    # Install plugin
    db.execute('INSERT INTO plugins (user_id, name, description, category, js_code, is_active) VALUES (?, ?, ?, ?, ?, 1)',
               (current_user.id, plugin['name'], plugin['description'], plugin['category'], plugin['code']))
    db.commit()
    return jsonify({'success': True})

@app.route('/sdk')
def sdk_docs():
    return render_template('sdk.html')

@app.route('/dashboard/templates')
@login_required
def dashboard_templates(): return render_template('dashboard/templates.html', section='templates')

@app.route('/editor')
def editor_new(): return render_template('editor.html', project_data={'id':None}, plugins=[])

@app.route('/editor/<int:pid>')
@login_required
def editor_existing(pid):
    project = get_db().execute('SELECT * FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id)).fetchone()
    if not project: return redirect(url_for('dashboard'))
    plugins = get_db().execute('SELECT js_code FROM plugins WHERE user_id = ? AND is_active = 1', (current_user.id,)).fetchall()
    return render_template('editor.html', project_data=dict(project), plugins=[p['js_code'] for p in plugins])

@app.route('/project/create', methods=['POST'])
@login_required
def create_project():
    uid = str(uuid.uuid4())
    db = get_db()
    cur = db.execute('INSERT INTO projects (user_id, name, project_uid) VALUES (?, ?, ?)', (current_user.id, request.json['name'], uid))
    pid = cur.lastrowid
    
    # FIXED: Load files from selected template
    t_id = request.json.get('template', 'blank')
    files = TEMPLATES.get(t_id, TEMPLATES['blank'])
    
    for path, content in files:
        db.execute('INSERT INTO files (project_id, filepath, content) VALUES (?, ?, ?)', (pid, path, content))
    db.commit()
    return jsonify({'success': True, 'id': pid})

@app.route('/api/project/<int:pid>/files')
@login_required
def get_files(pid):
    files = get_db().execute('SELECT * FROM files WHERE project_id = ?', (pid,)).fetchall()
    res = []
    for f in files:
        # FIXED: Robust handling of binary vs text
        is_asset = f['is_asset'] if 'is_asset' in f.keys() else 0
        try:
            content = f['content'].decode('utf-8')
            is_bin = False
        except:
            content = base64.b64encode(f['content']).decode('ascii')
            is_bin = True
            is_asset = 1 # Force asset if binary
            
        res.append({'path': f['filepath'], 'content': content, 'is_binary': is_bin, 'is_asset': is_asset})
    return jsonify(res)

@app.route('/api/project/<int:pid>/save', methods=['POST'])
@login_required
def save_project(pid):
    db = get_db()
    db.execute('DELETE FROM files WHERE project_id = ?', (pid,))
    for f in request.json.get('files', []):
        db.execute('INSERT INTO files (project_id, filepath, content, is_asset) VALUES (?, ?, ?, ?)',
                   (pid, f['path'], base64.b64decode(f['content_b64']), 1 if f.get('is_asset') else 0))
    db.commit()
    return jsonify({'success': True})

@app.route('/api/project/<int:pid>/publish', methods=['POST'])
@login_required
def publish_project(pid):
    db = get_db()
    project = db.execute('SELECT * FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id)).fetchone()
    if not project: return jsonify({'success': False}), 404
    # Toggle published state
    new_state = 0 if project['is_published_site'] else 1
    db.execute('UPDATE projects SET is_published_site = ? WHERE id = ?', (new_state, pid))
    db.commit()
    return jsonify({'success': True, 'is_published': new_state, 'url': f'/site/{project["project_uid"]}'})

@app.route('/api/project/<int:pid>/explore', methods=['POST'])
@login_required
def publish_to_explore(pid):
    db = get_db()
    project = db.execute('SELECT * FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id)).fetchone()
    if not project: return jsonify({'success': False}), 404
    # Toggle explore state
    new_state = 0 if project['is_on_explore'] else 1
    db.execute('UPDATE projects SET is_on_explore = ?, is_published_site = 1 WHERE id = ?', (new_state, pid))
    db.commit()
    return jsonify({'success': True, 'is_on_explore': new_state})

@app.route('/api/project/<int:pid>/delete', methods=['POST'])
@login_required
def delete_project(pid):
    db = get_db()
    db.execute('DELETE FROM projects WHERE id = ? AND user_id = ?', (pid, current_user.id))
    db.commit()
    return jsonify({'success': True})


@app.route('/api/project/<int:pid>/image', methods=['POST', 'GET'])
def project_image(pid):
    db = get_db()
    # GET: serve image stored in files table under filepath 'cover'
    if request.method == 'GET':
        f = db.execute('SELECT content FROM files WHERE project_id = ? AND filepath = ?', (pid, 'cover')).fetchone()
        if not f:
            return "", 404
        data = f['content']
        kind = imghdr.what(None, h=data)
        if not kind: mimetype = 'application/octet-stream'
        else:
            if kind == 'jpeg': mimetype = 'image/jpeg'
            else: mimetype = f'image/{kind}'
        return Response(data, mimetype=mimetype)

    # POST: upload/replace image (must be owner)
    if not current_user or not current_user.is_authenticated:
        return jsonify({'error': 'Authentication required'}), 401
    project = db.execute('SELECT id, user_id FROM projects WHERE id = ?', (pid,)).fetchone()
    if not project or project['user_id'] != current_user.id:
        return jsonify({'error': 'Not found'}), 404

    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    f = request.files['image']
    data = f.read()
    if not data:
        return jsonify({'error': 'Empty file'}), 400

    # store or replace cover
    try:
        # Ensure the projects table has an image_url column (runtime migration)
        cols = [r['name'] for r in db.execute("PRAGMA table_info(projects)").fetchall()]
        if 'image_url' not in cols:
            db.execute('ALTER TABLE projects ADD COLUMN image_url TEXT')
            db.commit()

        db.execute('INSERT OR REPLACE INTO files (project_id, filepath, content, is_asset) VALUES (?, ?, ?, ?)',
                   (pid, 'cover', data, 1))
        # set projects.image_url to the GET endpoint so templates can reference it
        image_url = f'/api/project/{pid}/image'
        db.execute('UPDATE projects SET image_url = ? WHERE id = ?', (image_url, pid))
        db.commit()
        return jsonify({'success': True, 'image_url': image_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- SERVERLESS ---
@app.route('/api/run-function/<project_uid>', methods=['POST'])
def run_fn(project_uid):
    p = get_db().execute('SELECT id FROM projects WHERE project_uid = ?', (project_uid,)).fetchone()
    if not p: return jsonify({'error': 'Project not found. Make sure to deploy your project first.'}), 404
    f = get_db().execute('SELECT content FROM files WHERE project_id = ? AND filepath = "server.py"', (p['id'],)).fetchone()
    if not f: return jsonify({'error': 'No server.py file found in project'}), 404
    stdout = io.StringIO()
    # FIXED: Provide necessary builtins for serverless functions
    safe_builtins = {
        'int': int, 'str': str, 'float': float, 'bool': bool, 'list': list, 'dict': dict,
        'len': len, 'range': range, 'print': lambda *args: print(*args, file=stdout),
        'True': True, 'False': False, 'None': None,
    }
    ctx = {
        'request': request.json or {},
        'db': DBInterface(p['id']),
        'print': lambda *args: print(*args, file=stdout),
        'response': None,
        'json': json,
        'hashlib': __import__('hashlib'),
    }
    try: exec(f['content'].decode('utf-8'), safe_builtins, ctx)
    except Exception as e: return jsonify({'error': str(e)}), 400
    return jsonify({'result': ctx['response'], 'logs': stdout.getvalue()})

class DBInterface:
    def __init__(self, pid): self.pid = pid
    def set(self, k, v): get_db().execute('INSERT OR REPLACE INTO kv_store (project_id, key_name, value) VALUES (?, ?, ?)', (self.pid, k, v)); get_db().commit()
    def get(self, k): 
        r = get_db().execute('SELECT value FROM kv_store WHERE project_id = ? AND key_name = ?', (self.pid, k)).fetchone()
        return r['value'] if r else None

# --- PUBLIC ---
@app.route('/site/<uid>')
def site(uid): return redirect(url_for('view_file', uid=uid, path='index.html'))

@app.route('/view/<uid>/<path:path>')
def view_file(uid, path):
    f = get_db().execute('SELECT f.content FROM files f JOIN projects p ON f.project_id = p.id WHERE p.project_uid = ? AND f.filepath = ?', (uid, path)).fetchone()
    if not f: return "404", 404
    c = f['content']
    if path.endswith('.html'):
        c = c.decode('utf-8').replace('<head>', f'<head><script>const PROJECT_UID="{uid}";</script>')
        return Response(c, mimetype='text/html')
    return Response(c, mimetype=mimetypes.guess_type(path)[0])


@app.route('/project_public/<project_uid>')
def project_public(project_uid):
    db = get_db()
    p = db.execute('SELECT p.*, u.username as username FROM projects p JOIN users u ON p.user_id = u.id WHERE p.project_uid = ?', (project_uid,)).fetchone()
    if not p: return "404", 404
    files = db.execute('SELECT filepath, content, is_asset FROM files WHERE project_id = ? ORDER BY filepath', (p['id'],)).fetchall()
    code_files = []
    for f in files:
        if f['is_asset']: continue
        try:
            content = f['content'].decode('utf-8')
        except:
            content = '[binary file]'
        code_files.append({'path': f['filepath'], 'content': content})
    return render_template('project_public.html', project=p, code_files=code_files, is_liked=False)


@app.route('/project_public/<project_uid>/file/<path:filepath>')
def view_shared_file(project_uid, filepath):
    f = get_db().execute('SELECT f.content FROM files f JOIN projects p ON f.project_id = p.id WHERE p.project_uid = ? AND f.filepath = ?', (project_uid, filepath)).fetchone()
    if not f: return "404", 404
    data = f['content']
    if filepath.endswith('.html'):
        return Response(data.decode('utf-8'), mimetype='text/html')
    # handle bytes vs text
    if isinstance(data, bytes):
        return Response(data, mimetype=mimetypes.guess_type(filepath)[0] or 'application/octet-stream')
    return Response(data, mimetype=mimetypes.guess_type(filepath)[0] or 'text/plain')


@app.route('/project/<project_uid>/like', methods=['POST'])
def project_like(project_uid):
    if not current_user or not current_user.is_authenticated:
        return jsonify({'error': 'Auth required'}), 401
    db = get_db()
    proj = db.execute('SELECT id, likes_count FROM projects WHERE project_uid = ?', (project_uid,)).fetchone()
    if not proj: return jsonify({'error': 'Not found'}), 404
    user_id = int(current_user.id)
    existing = db.execute('SELECT 1 FROM likes WHERE user_id = ? AND project_id = ?', (user_id, proj['id'])).fetchone()
    if existing:
        db.execute('DELETE FROM likes WHERE user_id = ? AND project_id = ?', (user_id, proj['id']))
        db.execute('UPDATE projects SET likes_count = likes_count - 1 WHERE id = ?', (proj['id'],))
        db.commit()
        new_count = db.execute('SELECT likes_count FROM projects WHERE id = ?', (proj['id'],)).fetchone()['likes_count']
        return jsonify({'success': True, 'liked': False, 'new_count': new_count})
    else:
        db.execute('INSERT INTO likes (user_id, project_id) VALUES (?, ?)', (user_id, proj['id']))
        db.execute('UPDATE projects SET likes_count = likes_count + 1 WHERE id = ?', (proj['id'],))
        db.commit()
        new_count = db.execute('SELECT likes_count FROM projects WHERE id = ?', (proj['id'],)).fetchone()['likes_count']
        return jsonify({'success': True, 'liked': True, 'new_count': new_count})


@app.route('/project/<project_uid>/remix', methods=['POST'])
def project_remix(project_uid):
    if not current_user or not current_user.is_authenticated:
        return jsonify({'error': 'Auth required'}), 401
    db = get_db()
    src = db.execute('SELECT * FROM projects WHERE project_uid = ?', (project_uid,)).fetchone()
    if not src: return jsonify({'error': 'Not found'}), 404
    # create new project copy for current user
    new_uid = secrets.token_urlsafe(8)
    name = (src['name'] or 'Untitled') + ' (Remix)'
    desc = src['description'] if 'description' in src.keys() else ''
    cur = db.execute('INSERT INTO projects (user_id, name, project_uid, description) VALUES (?, ?, ?, ?)',
                     (current_user.id, name, new_uid, desc))
    new_id = cur.lastrowid
    files = db.execute('SELECT filepath, content, is_asset FROM files WHERE project_id = ?', (src['id'],)).fetchall()
    for f in files:
        db.execute('INSERT INTO files (project_id, filepath, content, is_asset) VALUES (?, ?, ?, ?)',
                   (new_id, f['filepath'], f['content'], f['is_asset']))
    db.commit()
    return jsonify({'success': True, 'new_project_id': new_id})


@app.route('/api/project/<int:pid>/description', methods=['POST'])
@login_required
def update_project_description(pid):
    db = get_db()
    proj = db.execute('SELECT id, user_id FROM projects WHERE id = ?', (pid,)).fetchone()
    if not proj or proj['user_id'] != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json() or {}
    desc = data.get('description', '')
    db.execute('UPDATE projects SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', (desc, pid))
    db.commit()
    return jsonify({'success': True})

if __name__ == '__main__':
    if not os.path.exists(DATABASE): init_db()
    app.run(debug=True, port=8000)