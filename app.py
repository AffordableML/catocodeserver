import sqlite3
import uuid
import base64
import mimetypes
import io
import sys
import os
import secrets
import math, datetime, json, random, re
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

@app.cli.command('initdb')
def initdb_command(): init_db()

# --- TEMPLATES ---
TEMPLATES = {
    'blank': [('index.html', b'<h1>Hello World</h1>'), ('server.py', b'response = "Ready"')],
    'threejs': [
        ('index.html', b'<!DOCTYPE html><html><body style="margin:0"><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="app.js"></script></body></html>'),
        ('app.js', b'const scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);\nconst renderer = new THREE.WebGLRenderer();\nrenderer.setSize(window.innerWidth, window.innerHeight);\ndocument.body.appendChild(renderer.domElement);\nconst cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({color: 0x00ff00}));\nscene.add(cube); camera.position.z = 5;\nfunction animate() { requestAnimationFrame(animate); cube.rotation.x += 0.01; cube.rotation.y += 0.01; renderer.render(scene, camera); }\nanimate();')
    ],
    'phaser': [
        ('index.html', b'<!DOCTYPE html><html><body><script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script><script src="app.js"></script></body></html>'),
        ('app.js', b'new Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, scene: { create: function() { this.add.text(100, 100, "Phaser Active!", { fontSize: "64px", fill: "#fff" }); } } });')
    ],
    'kaboom': [
        ('index.html', b'<!DOCTYPE html><html><body><script src="https://unpkg.com/kaboom/dist/kaboom.js"></script><script src="app.js"></script></body></html>'),
        ('app.js', b'kaboom();\nadd([text("CatoCode!"), pos(120, 80)]);')
    ],
    'serverless_api': [
        ('index.html', b'''<!DOCTYPE html>
<html><head><title>Serverless API Demo</title>
<style>body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px}button{background:#3b82f6;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px}button:hover{background:#2563eb}#result{margin-top:20px;padding:20px;background:#f1f5f9;border-radius:8px;font-family:monospace}</style>
</head><body>
<h1>Serverless API Demo</h1>
<p>Click the button to call your backend function:</p>
<button onclick="callAPI()">Call API</button>
<div id="result"></div>
<script>
const uid = typeof PROJECT_UID !== "undefined" ? PROJECT_UID : "demo";
async function callAPI() {
  const res = await fetch("/api/run-function/" + uid, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action: "hello"})});
  document.getElementById("result").textContent = JSON.stringify(await res.json(), null, 2);
}
</script></body></html>'''),
        ('server.py', b'''# Serverless function example\n# Access db.get(key) and db.set(key, value) for storage\n\nvisits = int(db.get("visits") or 0) + 1\ndb.set("visits", str(visits))\n\nif request.get("action") == "hello":\n    response = {"message": "Hello from CatoCode!", "total_visits": visits}\nelse:\n    response = {"error": "Unknown action", "visits": visits}''')
    ],
    'serverless_crud': [
        ('index.html', b'''<!DOCTYPE html>
<html><head><title>CRUD App</title>
<style>*{box-sizing:border-box}body{font-family:system-ui;max-width:800px;margin:0 auto;padding:40px;background:#f8fafc}h1{color:#1e293b}.card{background:#fff;padding:24px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);margin-bottom:20px}input,textarea{width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px}button{background:#3b82f6;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer}button:hover{background:#2563eb}.item{padding:16px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}.delete{background:#ef4444;padding:8px 16px;font-size:14px}</style>
</head><body>
<h1>Simple CRUD App</h1>
<div class="card"><h3>Add New Item</h3>
<input id="title" placeholder="Title"><textarea id="content" placeholder="Content" rows="3"></textarea>
<button onclick="addItem()">Add Item</button></div>
<div class="card" id="items"><h3>Items</h3><div id="list">Loading...</div></div>
<script>
const uid = typeof PROJECT_UID !== "undefined" ? PROJECT_UID : "demo";
async function api(data) { return (await fetch("/api/run-function/" + uid, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)})).json(); }
async function load() { const r = await api({action:"list"}); document.getElementById("list").innerHTML = (r.result?.items || []).map(i => `<div class="item"><div><strong>${i.title}</strong><br><small>${i.content}</small></div><button class="delete" onclick="del('${i.id}')">Delete</button></div>`).join("") || "No items yet"; }
async function addItem() { await api({action:"add", title: document.getElementById("title").value, content: document.getElementById("content").value}); document.getElementById("title").value = ""; document.getElementById("content").value = ""; load(); }
async function del(id) { await api({action:"delete", id}); load(); }
load();
</script></body></html>'''),
        ('server.py', b'''# CRUD Serverless App\nimport json\n\n# Load existing items\nitems = json.loads(db.get("items") or "[]")\n\naction = request.get("action")\n\nif action == "list":\n    response = {"items": items}\nelif action == "add":\n    new_id = str(len(items) + 1)\n    items.append({"id": new_id, "title": request.get("title", ""), "content": request.get("content", "")})\n    db.set("items", json.dumps(items))\n    response = {"success": True, "id": new_id}\nelif action == "delete":\n    items = [i for i in items if i["id"] != request.get("id")]\n    db.set("items", json.dumps(items))\n    response = {"success": True}\nelse:\n    response = {"error": "Unknown action"}''')
    ],
    'serverless_auth': [
        ('index.html', b'''<!DOCTYPE html>
<html><head><title>Auth Demo</title>
<style>body{font-family:system-ui;max-width:400px;margin:100px auto;padding:20px}.card{background:#fff;padding:32px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.1)}h2{margin-top:0;color:#1e293b}input{width:100%;padding:14px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:16px;font-size:16px}button{width:100%;background:#3b82f6;color:#fff;border:none;padding:14px;border-radius:10px;font-size:16px;cursor:pointer}button:hover{background:#2563eb}.msg{padding:12px;border-radius:8px;margin-bottom:16px}.error{background:#fef2f2;color:#dc2626}.success{background:#f0fdf4;color:#16a34a}</style>
</head><body><div class="card">
<h2>Login / Register</h2>
<div id="msg"></div>
<input id="user" placeholder="Username"><input id="pass" type="password" placeholder="Password">
<button onclick="auth('login')">Login</button><br><br>
<button onclick="auth('register')" style="background:#10b981">Register</button>
</div><script>
const uid = typeof PROJECT_UID !== "undefined" ? PROJECT_UID : "demo";
async function auth(action) {
  const r = await (await fetch("/api/run-function/" + uid, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action, username: document.getElementById("user").value, password: document.getElementById("pass").value})})).json();
  document.getElementById("msg").innerHTML = r.result?.success ? `<div class="msg success">${r.result.message}</div>` : `<div class="msg error">${r.result?.error || "Error"}</div>`;
}
</script></body></html>'''),
        ('server.py', b'''# Simple Auth System\nimport hashlib\nimport json\n\nusers = json.loads(db.get("users") or "{}")\naction = request.get("action")\nusername = request.get("username", "").strip()\npassword = request.get("password", "")\npwd_hash = hashlib.sha256(password.encode()).hexdigest()\n\nif action == "register":\n    if not username or not password:\n        response = {"error": "Username and password required"}\n    elif username in users:\n        response = {"error": "Username already exists"}\n    else:\n        users[username] = pwd_hash\n        db.set("users", json.dumps(users))\n        response = {"success": True, "message": f"User {username} registered!"}\nelif action == "login":\n    if users.get(username) == pwd_hash:\n        response = {"success": True, "message": f"Welcome back, {username}!"}\n    else:\n        response = {"error": "Invalid credentials"}\nelse:\n    response = {"error": "Unknown action"}''')
    ],
    # ===== GAME TEMPLATES =====
    'game_platformer': [
        ('index.html', b'<!DOCTYPE html><html><head><title>Platformer</title><style>*{margin:0;padding:0}body{background:#1a1a2e;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{border:4px solid #16213e;border-radius:8px}</style></head><body><canvas id="game"></canvas><script src="game.js"></script></body></html>'),
        ('game.js', b'''// ========== SCROLLING PLATFORMER ==========
const GAME_TITLE = "Super Jumper";
const PLAYER_SPEED = 5;
const JUMP_FORCE = 14;
const GRAVITY = 0.6;
const WORLD_WIDTH = 3000;  // World is wider than canvas

// COLORS
const PLAYER_COLOR = "#00ff88";
const PLATFORM_COLOR = "#4a4e69";
const BG_COLOR = "#1a1a2e";
const SKY_COLOR = "#0f172a";
// ==========================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800; canvas.height = 600;

let camera = { x: 0 };
let player = { x: 100, y: 400, w: 40, h: 50, vx: 0, vy: 0, onGround: false, score: 0 };

// Generate platforms across the world
let platforms = [
    { x: 0, y: 550, w: 500, h: 50 },
    { x: 400, y: 450, w: 200, h: 20 },
    { x: 700, y: 380, w: 150, h: 20 },
    { x: 950, y: 480, w: 300, h: 20 },
    { x: 1100, y: 350, w: 120, h: 20 },
    { x: 1350, y: 280, w: 150, h: 20 },
    { x: 1550, y: 200, w: 100, h: 20 },
    { x: 1700, y: 550, w: 400, h: 50 },
    { x: 1850, y: 420, w: 150, h: 20 },
    { x: 2100, y: 350, w: 200, h: 20 },
    { x: 2350, y: 280, w: 150, h: 20 },
    { x: 2550, y: 550, w: 450, h: 50 },
    { x: 2700, y: 400, w: 200, h: 20 },
    { x: 2850, y: 300, w: 150, h: 20 }
];
let coins = [
    {x:300,y:520},{x:500,y:420},{x:800,y:350},{x:1050,y:450},
    {x:1200,y:320},{x:1450,y:250},{x:1600,y:170},{x:1950,y:390},
    {x:2200,y:320},{x:2450,y:250},{x:2750,y:370},{x:2900,y:270}
].map(c=>({...c,r:15,got:false}));

let keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function update() {
    // Movement
    if (keys["ArrowLeft"]||keys["KeyA"]) player.vx = -PLAYER_SPEED;
    else if (keys["ArrowRight"]||keys["KeyD"]) player.vx = PLAYER_SPEED;
    else player.vx = 0;
    if ((keys["ArrowUp"]||keys["KeyW"]||keys["Space"]) && player.onGround) {
        player.vy = -JUMP_FORCE; player.onGround = false;
    }
    
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;
    
    // Collision with platforms
    for (let p of platforms) {
        if (player.x < p.x+p.w && player.x+player.w > p.x && 
            player.y+player.h > p.y && player.y+player.h < p.y+p.h+player.vy) {
            player.y = p.y - player.h; player.vy = 0; player.onGround = true;
        }
    }
    
    // Collect coins
    for (let c of coins) {
        if (!c.got && Math.hypot((player.x+player.w/2)-c.x,(player.y+player.h/2)-c.y) < c.r+20) {
            c.got = true; player.score++;
        }
    }
    
    // World bounds
    if (player.x < 0) player.x = 0;
    if (player.x > WORLD_WIDTH - player.w) player.x = WORLD_WIDTH - player.w;
    if (player.y > canvas.height + 100) { player.y = 400; player.x = 100; }
    
    // Camera follows player (smooth)
    const targetCam = player.x - canvas.width/2 + player.w/2;
    camera.x += (targetCam - camera.x) * 0.1;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > WORLD_WIDTH - canvas.width) camera.x = WORLD_WIDTH - canvas.width;
}

function draw() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, SKY_COLOR);
    grad.addColorStop(1, BG_COLOR);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x, 0);
    
    // Draw platforms
    ctx.fillStyle = PLATFORM_COLOR;
    for (let p of platforms) ctx.fillRect(p.x, p.y, p.w, p.h);
    
    // Draw coins
    for (let c of coins) {
        if (!c.got) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
            ctx.fillStyle = "#ffd700";
            ctx.fill();
            ctx.strokeStyle = "#b8860b";
            ctx.stroke();
        }
    }
    
    // Draw player
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    
    ctx.restore();
    
    // UI (fixed on screen)
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(GAME_TITLE, 20, 35);
    ctx.textAlign = "right";
    ctx.fillText("Coins: " + player.score + "/" + coins.length, canvas.width - 20, 35);
    
    // Progress bar
    const progress = player.x / WORLD_WIDTH;
    ctx.fillStyle = "#333";
    ctx.fillRect(20, canvas.height - 30, canvas.width - 40, 10);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(20, canvas.height - 30, (canvas.width - 40) * progress, 10);
    
    // Win screen
    if (player.score === coins.length) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN!", canvas.width/2, canvas.height/2);
    }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();''')
    ],
    'game_snake': [
        ('index.html', b'<!DOCTYPE html><html><head><title>Snake</title><style>*{margin:0;padding:0}body{background:#0d1117;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;font-family:sans-serif;color:#fff}canvas{border:4px solid #30363d;border-radius:8px}h1{margin-bottom:20px;color:#58a6ff}</style></head><body><h1>Snake</h1><canvas id="game"></canvas><p style="margin-top:20px;color:#8b949e">Arrow Keys to Move</p><script src="game.js"></script></body></html>'),
        ('game.js', b'''// ========== CUSTOMIZE YOUR GAME ==========
const SNAKE_COLOR = "#58a6ff";
const FOOD_COLOR = "#f85149";
const GRID_SIZE = 20;
const GAME_SPEED = 100;
// ==========================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 400; canvas.height = 400;
let snake = [{x:10,y:10}], food = {x:15,y:10}, dir = {x:1,y:0}, score = 0, over = false;

document.addEventListener("keydown", e => {
    if(e.key==="ArrowUp"&&dir.y!==1)dir={x:0,y:-1};
    if(e.key==="ArrowDown"&&dir.y!==-1)dir={x:0,y:1};
    if(e.key==="ArrowLeft"&&dir.x!==1)dir={x:-1,y:0};
    if(e.key==="ArrowRight"&&dir.x!==-1)dir={x:1,y:0};
    if(over&&e.key===" ")location.reload();
});

function spawnFood(){food={x:Math.floor(Math.random()*(canvas.width/GRID_SIZE)),y:Math.floor(Math.random()*(canvas.height/GRID_SIZE))};}

function update() {
    if(over)return;
    const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(head.x<0||head.x>=canvas.width/GRID_SIZE||head.y<0||head.y>=canvas.height/GRID_SIZE){over=true;return;}
    for(let s of snake)if(head.x===s.x&&head.y===s.y){over=true;return;}
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y){score+=10;spawnFood();}else snake.pop();
}

function draw() {
    ctx.fillStyle="#0d1117";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=SNAKE_COLOR;
    for(let s of snake)ctx.fillRect(s.x*GRID_SIZE+1,s.y*GRID_SIZE+1,GRID_SIZE-2,GRID_SIZE-2);
    ctx.fillStyle=FOOD_COLOR;ctx.beginPath();ctx.arc(food.x*GRID_SIZE+GRID_SIZE/2,food.y*GRID_SIZE+GRID_SIZE/2,GRID_SIZE/2-2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="bold 16px sans-serif";ctx.fillText("Score: "+score,10,25);
    if(over){ctx.fillStyle="rgba(0,0,0,0.8)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=FOOD_COLOR;ctx.font="bold 36px sans-serif";ctx.textAlign="center";ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2-20);ctx.fillStyle="#fff";ctx.font="20px sans-serif";ctx.fillText("Score: "+score,canvas.width/2,canvas.height/2+20);ctx.fillText("SPACE to restart",canvas.width/2,canvas.height/2+50);}
}
setInterval(()=>{update();draw();},GAME_SPEED);''')
    ],
    'game_flappy': [
        ('index.html', b'<!DOCTYPE html><html><head><title>Flappy</title><style>*{margin:0;padding:0}body{background:#70c5ce;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3)}</style></head><body><canvas id="game"></canvas><script src="game.js"></script></body></html>'),
        ('game.js', b'''// ========== CUSTOMIZE YOUR GAME ==========
const BIRD_COLOR = "#f7dc6f";
const PIPE_COLOR = "#27ae60";
const GRAVITY = 0.4;
const FLAP_FORCE = -7;
const PIPE_SPEED = 3;
const PIPE_GAP = 150;
// ==========================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 400; canvas.height = 600;
let bird = {x:80,y:300,vy:0,size:25}, pipes = [], score = 0, over = false, started = false;

document.addEventListener("keydown", e => { if(e.code==="Space"){if(!started)started=true;if(!over)bird.vy=FLAP_FORCE;if(over)location.reload();} });
canvas.addEventListener("click", () => { if(!started)started=true;if(!over)bird.vy=FLAP_FORCE;if(over)location.reload(); });

function spawnPipe(){pipes.push({x:canvas.width,gapY:Math.random()*(canvas.height-200-PIPE_GAP)+100,scored:false});}

function update() {
    if(!started||over)return;
    bird.vy+=GRAVITY;bird.y+=bird.vy;
    if(pipes.length===0||pipes[pipes.length-1].x<canvas.width-200)spawnPipe();
    for(let i=pipes.length-1;i>=0;i--){
        pipes[i].x-=PIPE_SPEED;
        if(!pipes[i].scored&&pipes[i].x+60<bird.x){pipes[i].scored=true;score++;}
        if(pipes[i].x<-70)pipes.splice(i,1);
        const p=pipes[i];
        if(bird.x+bird.size>p.x&&bird.x-bird.size<p.x+60){if(bird.y-bird.size<p.gapY||bird.y+bird.size>p.gapY+PIPE_GAP)over=true;}
    }
    if(bird.y+bird.size>canvas.height-80||bird.y-bird.size<0)over=true;
}

function draw() {
    ctx.fillStyle="#70c5ce";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle=PIPE_COLOR;
    for(let p of pipes){ctx.fillRect(p.x,0,60,p.gapY);ctx.fillRect(p.x,p.gapY+PIPE_GAP,60,canvas.height);}
    ctx.fillStyle="#ded895";ctx.fillRect(0,canvas.height-80,canvas.width,80);
    ctx.fillStyle=BIRD_COLOR;ctx.beginPath();ctx.arc(bird.x,bird.y,bird.size,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.font="bold 48px sans-serif";ctx.textAlign="center";ctx.fillText(score,canvas.width/2,80);
    if(!started){ctx.fillStyle="rgba(0,0,0,0.5)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#fff";ctx.font="bold 32px sans-serif";ctx.fillText("Tap or Space",canvas.width/2,canvas.height/2);}
    if(over){ctx.fillStyle="rgba(0,0,0,0.7)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#e74c3c";ctx.font="bold 42px sans-serif";ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2-30);ctx.fillStyle="#fff";ctx.font="24px sans-serif";ctx.fillText("Score: "+score,canvas.width/2,canvas.height/2+20);}
}
function loop(){update();draw();requestAnimationFrame(loop);}loop();''')
    ],
    'game_pong': [
        ('index.html', b'<!DOCTYPE html><html><head><title>Pong</title><style>*{margin:0;padding:0}body{background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{border:4px solid #333}</style></head><body><canvas id="game"></canvas><script src="game.js"></script></body></html>'),
        ('game.js', b'''// ========== CUSTOMIZE YOUR GAME ==========
const PADDLE_COLOR = "#fff";
const BALL_COLOR = "#fff";
const PADDLE_SPEED = 8;
const BALL_SPEED = 6;
const WINNING_SCORE = 5;
// ==========================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800; canvas.height = 500;
let player = {x:20,y:200,w:15,h:100}, ai = {x:canvas.width-35,y:200,w:15,h:100};
let ball = {x:canvas.width/2,y:canvas.height/2,vx:BALL_SPEED,vy:BALL_SPEED*0.5,r:10};
let playerScore = 0, aiScore = 0, keys = {};

document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function resetBall(){ball.x=canvas.width/2;ball.y=canvas.height/2;ball.vx=BALL_SPEED*(Math.random()>0.5?1:-1);ball.vy=BALL_SPEED*0.5*(Math.random()>0.5?1:-1);}

function update() {
    if((keys["ArrowUp"]||keys["KeyW"])&&player.y>0)player.y-=PADDLE_SPEED;
    if((keys["ArrowDown"]||keys["KeyS"])&&player.y+player.h<canvas.height)player.y+=PADDLE_SPEED;
    const aiCenter=ai.y+ai.h/2;
    if(aiCenter<ball.y-20)ai.y+=PADDLE_SPEED*0.7;
    if(aiCenter>ball.y+20)ai.y-=PADDLE_SPEED*0.7;
    ball.x+=ball.vx;ball.y+=ball.vy;
    if(ball.y-ball.r<0||ball.y+ball.r>canvas.height)ball.vy*=-1;
    if(ball.x-ball.r<player.x+player.w&&ball.y>player.y&&ball.y<player.y+player.h){ball.vx=Math.abs(ball.vx);ball.vy=(ball.y-(player.y+player.h/2))*0.1;}
    if(ball.x+ball.r>ai.x&&ball.y>ai.y&&ball.y<ai.y+ai.h){ball.vx=-Math.abs(ball.vx);ball.vy=(ball.y-(ai.y+ai.h/2))*0.1;}
    if(ball.x<0){aiScore++;resetBall();}
    if(ball.x>canvas.width){playerScore++;resetBall();}
}

function draw() {
    ctx.fillStyle="#000";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setLineDash([10,10]);ctx.strokeStyle="#333";ctx.beginPath();ctx.moveTo(canvas.width/2,0);ctx.lineTo(canvas.width/2,canvas.height);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=PADDLE_COLOR;ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillRect(ai.x,ai.y,ai.w,ai.h);
    ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fillStyle=BALL_COLOR;ctx.fill();
    ctx.font="bold 64px monospace";ctx.textAlign="center";ctx.fillText(playerScore,canvas.width/4,70);ctx.fillText(aiScore,canvas.width*3/4,70);
    if(playerScore>=WINNING_SCORE||aiScore>=WINNING_SCORE){ctx.fillStyle="rgba(0,0,0,0.8)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=playerScore>=WINNING_SCORE?"#2ecc71":"#e74c3c";ctx.font="bold 48px sans-serif";ctx.fillText(playerScore>=WINNING_SCORE?"YOU WIN!":"AI WINS!",canvas.width/2,canvas.height/2);}
}
function loop(){update();draw();requestAnimationFrame(loop);}loop();''')
    ],
    # ===== BLOCK-BASED GAME BUILDER =====
    'game_blocks': [
        ('index.html', b'<!DOCTYPE html><html><body><script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script><script src="app.js"></script></body></html>'),
        ('app.js', b'new Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, scene: { create: function() { this.add.text(100, 100, "Phaser Active!", { fontSize: "64px", fill: "#fff" }); } } });')
    ] + [('blocks.json', b'{}'), ('README.md', b'# Block Game\nVisual block coding enabled!')],
    # ===== GDEVELOP GAME EXAMPLES =====
    'game_gdevelop_platformer': [
        ('index.html', b'<!DOCTYPE html><html><head><title>GDevelop Platformer</title><style>*{margin:0;padding:0}body{background:#1a1a2e;display:flex;justify-content:center;align-items:center;min-height:100vh}canvas{border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3)}</style></head><body><canvas id="game"></canvas><script src="game.js"></script></body></html>'),
        ('game.js', b'''// GDevelop-like Platformer Game Template
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ===== SPRITES =====
const sprites = {};

// ===== GAME STATE =====
let player = { x: 400, y: 300, width: 50, height: 50, color: "#22c55e", speed: 5 };
let keys = {};
let score = 0;

// ===== INPUT HANDLING =====
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ===== BLOCK-GENERATED CODE START =====
// When game starts
function onGameStart() {
    // Add your startup code here
}

// Every frame
function onUpdate() {
    // Player movement (arrow keys)
    if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= player.speed;
    if (keys["ArrowRight"] || keys["KeyD"]) player.x += player.speed;
    if (keys["ArrowUp"] || keys["KeyW"]) player.y -= player.speed;
    if (keys["ArrowDown"] || keys["KeyS"]) player.y += player.speed;
    
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Draw everything
function onDraw() {
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw score
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Score: " + score, 20, 40);
}
// ===== BLOCK-GENERATED CODE END =====

// ===== GAME LOOP =====
onGameStart();

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onUpdate();
    onDraw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
'''),
        ('blocks.json', b'''{"blocks":[
    {"id":"start","type":"event","label":"When Game Starts","code":"// Game started"},
    {"id":"update","type":"event","label":"Every Frame","code":""},
    {"id":"move_right","type":"motion","label":"Move Right","code":"player.x += player.speed;"},
    {"id":"move_left","type":"motion","label":"Move Left","code":"player.x -= player.speed;"},
    {"id":"move_up","type":"motion","label":"Move Up","code":"player.y -= player.speed;"},
    {"id":"move_down","type":"motion","label":"Move Down","code":"player.y += player.speed;"},
    {"id":"set_color","type":"looks","label":"Set Color","code":"player.color = \\"#COLOR\\";","inputs":["color"]},
    {"id":"add_score","type":"control","label":"Add to Score","code":"score += VALUE;","inputs":["value"]}
]}''')
    ]
}



@app.route('/')
def index(): return render_template('index.html')

@app.route('/notebooks')
def notebooks(): return render_template('notebooks.html')

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
        except sqlite3.IntegrityError: flash('Username taken', 'error')
    return render_template('register.html')

@app.route('/logout')
def logout(): logout_user(); return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    projects = get_db().execute('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', (current_user.id,)).fetchall()
    platformers = get_db().execute('SELECT * FROM platformer_games WHERE user_id = ? ORDER BY updated_at DESC', (current_user.id,)).fetchall()
    return render_template('dashboard/projects.html', projects=projects, platformers=platformers, section='projects')

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

if __name__ == '__main__':
    if not os.path.exists(DATABASE): init_db()
    app.run(debug=True)