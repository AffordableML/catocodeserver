import sqlite3
import uuid
import base64
import mimetypes
import io
import sys
import os
import secrets
import math, datetime, json, random, re
import openai
from flask import Flask, render_template, request, jsonify, Response, redirect, url_for, flash, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

app = Flask(__name__)
app.config['SECRET_KEY'] = 'catocode-ultra-secret-2025'
DATABASE = 'database.db'

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
    if db is None: db = g._database = sqlite3.connect(DATABASE); db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(e): 
    db = getattr(g, '_database', None)
    if db: db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f: db.cursor().executescript(f.read())
        db.commit()

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

# --- TEMPLATES ---
TEMPLATES = {
    'blank': [
        ('index.html', b'<!DOCTYPE html>\n<html>\n<head>\n    <title>My Site</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World</h1>\n    <p>Start building your site!</p>\n    <script src="script.js"></script>\n</body>\n</html>'),
        ('style.css', b'/* Add your styles here */\nbody {\n    font-family: system-ui, sans-serif;\n    max-width: 800px;\n    margin: 0 auto;\n    padding: 20px;\n}\n'),
        ('script.js', b'// Add your JavaScript here\nconsole.log("Hello!");\n')
    ],
    'voxel': [
        ('index.html', b'''<!DOCTYPE html>
<html>
<head>
    <title>Voxel Game</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #crosshair {
            position: fixed; top: 50%; left: 50%;
            width: 20px; height: 20px;
            transform: translate(-50%, -50%);
            pointer-events: none;
        }
        #crosshair::before, #crosshair::after {
            content: ''; position: absolute; background: white;
        }
        #crosshair::before { width: 2px; height: 20px; left: 9px; }
        #crosshair::after { width: 20px; height: 2px; top: 9px; }
        #hotbar {
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%);
            display: flex; gap: 4px;
            background: rgba(0,0,0,0.5); padding: 8px;
            border-radius: 8px;
        }
        .slot { width: 40px; height: 40px; border: 2px solid #555; cursor: pointer; }
        .slot.active { border-color: white; }
        #info {
            position: fixed; top: 10px; left: 10px;
            color: white; font-family: monospace;
            background: rgba(0,0,0,0.5); padding: 10px;
        }
    </style>
</head>
<body>
    <div id="crosshair"></div>
    <div id="hotbar"></div>
    <div id="info">WASD to move | Click to break | Right-click to place | 1-4 blocks</div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="game.js"></script>
</body>
</html>'''),
        ('game.js', b'''// Voxel Game - Custom Textures
    leaves: createTexture('#228b22', '#1a6b1a'),
    brick: createTexture('#b22222', '#8b0000')
};


}

// Generate terrain
            addVoxel(
                pos.x + normal.x,
                pos.y + normal.y,
                pos.z + normal.z,
                COLORS[selectedBlock]
            );
        }
    }
});

});


window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});'''),
    ],
    'shooter3d': [
        ('index.html', b'''<!DOCTYPE html>
<html>
<head>
    <title>3D Shooter</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #crosshair {
            position: fixed; top: 50%; left: 50%;
            width: 30px; height: 30px;
            transform: translate(-50%, -50%);
            pointer-events: none;
        }
        #crosshair::before, #crosshair::after {
            content: ''; position: absolute; background: red;
        }
        #crosshair::before { width: 2px; height: 30px; left: 14px; }
        #crosshair::after { width: 30px; height: 2px; top: 14px; }
        #hud {
            position: fixed; top: 20px; left: 20px;
            color: white; font-family: monospace; font-size: 20px;
            text-shadow: 2px 2px 0 #000;
        }
        #ammo {
            position: fixed; bottom: 20px; right: 20px;
            color: white; font-family: monospace; font-size: 30px;
        }
    </style>
</head>
<body>
    <div id="crosshair"></div>
    <div id="hud">Health: 100 | Score: 0</div>
    <div id="ammo">Ammo: 20</div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="game.js"></script>
</body>
</html>'''),
        ('game.js', b'''// 3D Shooter Game
    bullet.velocity = dir.multiplyScalar(0.5);
    scene.add(bullet);
    bullets.push(bullet);
}

}

// Spawn initial enemies
                
                if(e.hp <= 0) {
                    scene.remove(e);
                    enemies.splice(j, 1);
            }
        }
        
        // Remove far bullets
        if(b.position.length() > 50) {
            scene.remove(b);
            bullets.splice(i, 1);
        }
    }
    
    // Move enemies toward player
    enemies.forEach(e => {
}


window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});'''),
    ],
    'roguelike': [
        ('index.html', b'''<!DOCTYPE html>
<html>
<head>
    <title>Roguelike</title>
    <style>
        body { background: #111; color: #eee; font-family: monospace; overflow: hidden; }
        #game { display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { border: 2px solid #333; background: #000; }
        #ui { position: fixed; top: 10px; left: 10px; font-size: 18px; }
        #log { position: fixed; bottom: 10px; left: 10px; color: #888; font-size: 14px; }
    </style>
</head>
<body>
    <div id="ui">HP: 100 | Level: 1 | Score: 0</div>
    <div id="game"><canvas id="c" width="600" height="400"></canvas></div>
    <div id="log">Welcome to the dungeon!</div>
    <script src="game.js"></script>
</body>
</html>'''),
        ('game.js', b'''// Roguelike Game
    gold: '$',
    stairs: '>'
};

    enemies = [];
    items = [];
    }
    
    // Items
    items.forEach(i => {
        ctx.fillStyle = '#ff0';
        ctx.font = '16px monospace';
        ctx.fillText('$', i.x * TILE + 4, i.y * TILE + 15);
    });
    
    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = '#f00';
        ctx.font = '16px monospace';
        ctx.fillText('E', e.x * TILE + 4, e.y * TILE + 15);
    });
    
    // Player
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
            enemies = enemies.filter(e => e !== enemy);
        
        // Stairs
        if(map[ny][nx] === TILES.stairs) {
    enemies.forEach(e => {
    });
    
});

generateMap();
draw();'''),
    ],
    'portfolio': [
        ('index.html', b'''<!DOCTYPE html>
<html>
<head>
    <title>My Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <div class="logo">My Portfolio</div>
        <div class="links">
            <a href="#about">About</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
        </div>
    </nav>
    
    <header>
        <h1>Hi, I am a Developer</h1>
        <p>I build amazing web experiences</p>
    </header>
    
    <section id="about">
        <h2>About Me</h2>
        <p>I'm a passionate developer who loves creating websites and applications.</p>
    </section>
    
    <section id="projects">
        <h2>My Projects</h2>
        <div class="project-grid">
            <div class="project">
                <h3>Project 1</h3>
                <p>A cool project I built</p>
            </div>
            <div class="project">
                <h3>Project 2</h3>
                <p>Another awesome project</p>
            </div>
            <div class="project">
                <h3>Project 3</h3>
                <p>Yet another great project</p>
            </div>
        </div>
    </section>
    
    <section id="contact">
        <h2>Contact Me</h2>
        <form>
            <input type="text" placeholder="Name" required>
            <input type="email" placeholder="Email" required>
            <textarea placeholder="Message" rows="4" required></textarea>
            <button type="submit">Send</button>
        </form>
    </section>
    
    <footer>
        <p>&copy; 2026 My Portfolio</p>
    </footer>
</body>
</html>'''),
        ('style.css', b'''* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
nav { display: flex; justify-content: space-between; padding: 1rem 5%; background: #fff; position: fixed; width: 100%; top: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.logo { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
.links a { margin-left: 2rem; color: #333; text-decoration: none; }
.links a:hover { color: #2563eb; }
header { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-align: center; padding: 0 20px; }
header h1 { font-size: 4rem; margin-bottom: 1rem; }
header p { font-size: 1.5rem; opacity: 0.9; }
section { padding: 5rem 10%; }
section h2 { font-size: 2.5rem; margin-bottom: 2rem; text-align: center; }
#projects { background: #f8fafc; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
.project { background: #fff; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.project h3 { margin-bottom: 0.5rem; color: #2563eb; }
#contact { background: #fff; }
form { max-width: 500px; margin: 0 auto; }
input, textarea { width: 100%; padding: 1rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 0.5rem; }
button { background: #2563eb; color: #fff; padding: 1rem 2rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
button:hover { background: #1d4ed8; }
footer { background: #1e293b; color: #fff; text-align: center; padding: 2rem; }'''),
    ],
    'blog': [
        ('index.html', b'''<!DOCTYPE html>
<html>
<head>
    <title>My Blog</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>My Blog</h1>
        <p>Thoughts on development and technology</p>
    </header>
    
    <main>
        <article class="post">
            <h2>Getting Started with Web Development</h2>
            <p class="meta">January 15, 2026</p>
            <p>Web development is an exciting journey. Here's how to begin...</p>
            <a href="#">Read more →</a>
        </article>
        
        <article class="post">
            <h2>The Power of JavaScript</h2>
            <p class="meta">January 10, 2026</p>
            <p>JavaScript has become one of the most versatile programming languages...</p>
            <a href="#">Read more →</a>
        </article>
        
        <article class="post">
            <h2>Why I Love Building for the Web</h2>
            <p class="meta">January 5, 2026</p>
            <p>The web platform offers incredible opportunities for developers...</p>
            <a href="#">Read more →</a>
        </article>
    </main>
    
    <aside>
        <h3>About</h3>
        <p>Welcome to my blog! I write about web development, programming, and technology.</p>
    </aside>
    
    <footer>
        <p>&copy; 2026 My Blog</p>
    </footer>
</body>
</html>'''),
        ('style.css', b'''* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; line-height: 1.7; color: #333; max-width: 900px; margin: 0 auto; padding: 0 20px; }
header { text-align: center; padding: 4rem 0 2rem; border-bottom: 1px solid #eee; }
header h1 { font-size: 3rem; color: #1e293b; }
header p { color: #64748b; font-size: 1.2rem; }
main { margin-top: 3rem; }
.post { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }
.post h2 { font-size: 1.8rem; color: #1e293b; margin-bottom: 0.5rem; }
.meta { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1rem; }
.post a { color: #2563eb; text-decoration: none; font-weight: 500; }
.post a:hover { text-decoration: underline; }
aside { background: #f8fafc; padding: 2rem; border-radius: 1rem; margin-top: 3rem; }
aside h3 { margin-bottom: 1rem; }
footer { text-align: center; padding: 3rem 0; margin-top: 3rem; color: #94a3b8; border-top: 1px solid #eee; }'''),
    ],
}

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = get_db().execute('SELECT * FROM users WHERE username = ?', (request.form['username'],)).fetchone()
        if user and check_password_hash(user['password_hash'], request.form['password']):
            login_user(User(user['id'], user['username'], user['storage_used']))

@app.route('/register', methods=['GET', 'POST'])
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
            flash(f'Error: {e}', 'error')
    return render_template('register.html')

@app.route('/explore')
    // Draw platforms
    ctx.fillStyle = PLATFORM_COLOR;
        }
    }
    
    // Draw player
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(GAME_TITLE, 20, 35);
    ctx.textAlign = "right";
        ('game.js', b'''// ========== CUSTOMIZE YOUR GAME ==========
    if(over&&e.key===" ")location.reload();
});

        ('index.html', b'<!DOCTYPE html><html><head><title>Flappy</title><style>*{margin:0;padding:0}body{background:#70c5ce;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3)}</style></head><body><canvas id="game"></canvas><script src="game.js"></script></body></html>'),
        ('game.js', b'''// ========== CUSTOMIZE YOUR GAME ==========
        ('app.js', b'new Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, scene: { create: function() { this.add.text(100, 100, "Phaser Active!", { fontSize: "64px", fill: "#fff" }); } } });')
    ] + [('blocks.json', b'{}'), ('README.md', b'# Block Game\nVisual block coding enabled!')],
    # ===== GDEVELOP GAME EXAMPLES =====
    'game_gdevelop_platformer': [
        ('index.html', b'<!DOCTYPE html><html><head><title>GDevelop Platformer</title><style>*{margin:0;padding:0}body{background:#1a1a2e;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3)}</style></head><body><canvas id="game"></canvas><script src="game.js"></script></body></html>'),
        ('game.js', b'''// GDevelop-like Platformer Game Template
    ctx.fillText("Score: " + score, 20, 40);
}
// ===== BLOCK-GENERATED CODE END =====

// ===== GAME LOOP =====
onGameStart();

    {"id":"start","type":"event","label":"When Game Starts","code":"// Game started"},
    {"id":"update","type":"event","label":"Every Frame","code":""},



@app.route('/')
def index(): return render_template('index.html')

@app.route('/notebooks')
def notebooks(): return render_template('notebooks.html')

@app.route('/ai')
def ai_builder():
    api_key = os.environ.get('GOOGLE_AI_API_KEY', '')
    recent = []
    if current_user.is_authenticated:
        projects = get_db().execute(
            "SELECT name, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 6",
            (current_user.id,)
        ).fetchall()
        for p in projects:
            recent.append({
                'name': p['name'],
                'created': p['created_at'].split()[0] if p['created_at'] else 'Recently',
                'type': 'project'
            })
    return render_template('ai.html', recent_projects=recent, last_prompt='')

@app.route('/pixel-editor')
@login_required
def pixel_editor():
    return render_template('pixel-editor.html')

@app.route('/api/ai/generate', methods=['POST'])
def ai_generate():
    data = request.get_json()
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    
    system_prompt = """You are an expert web developer. Generate complete, working HTML, CSS, and JavaScript code based on the user's request.

Create a single HTML file with embedded CSS and JS that:
1. Is fully functional and working
2. Has modern, beautiful styling
3. Uses clean, maintainable code
4. Follows best practices

Respond ONLY with valid JSON in this exact format:
{"html": "complete HTML code", "css": "complete CSS code", "js": "complete JavaScript code"}

Do NOT include any explanations or markdown. Just the JSON."""
    
    try:
        client = openai.OpenAI(
            api_key=os.environ.get('POE_API_KEY', ''),
            base_url="https://api.poe.com/v1"
        )
        
        chat = client.chat.completions.create(
            model="kimi-k2.5",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=8000
        )
        
        content = chat.choices[0].message.content
        
        # Parse JSON response
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(content)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"AI Generation Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/explore')
def explore():
    projects = get_db().execute('''
        SELECT p.*, u.username as author FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.is_on_explore = 1 
        ORDER BY p.likes_count DESC, p.created_at DESC
    ''').fetchall()
    return render_template('explore.html', projects=projects)
