# 🐱 CatoCode

<p align="center">
  <img src="static/images/hero.png" alt="CatoCode Hero" width="800">
</p>

---

<p align="center">
  <strong>Building the Future of Web Development, One Block at a Time.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-game-builder">Game Builder</a>
</p>

---

## ✨ Features

CatoCode is a comprehensive web-based development environment designed for creators, developers, and data scientists.

*   🎮 **Platformer Builder**: An intuitive, block-based level editor for creating 2D platformers.
*   📓 **Interactive Notebooks**: Run Python code in your browser with full support for NumPy, Pandas, and Matplotlib.
*   📁 **Project Management**: Organize your code projects and games in a centralized dashboard.
*   🌍 **One-Click Publishing**: Share your creations with the world instantly.
*   🛠️ **Custom Tile & Sound Engine**: Design your own pixel art tiles and integrate custom sound effects.

## 🚀 Tech Stack

- **Backend**: [Python](https://www.python.org/) with [Flask](https://flask.palletsprojects.com/)
- **Database**: [SQLite](https://www.sqlite.org/)
- **Frontend**: Vanilla Javascript, CSS3 (Modern Glassmorphism Design)
- **Engine**: Custom 2D Canvas Engine for Games
- **Scientific Computing**: [Pyodide](https://pyodide.org/) for browser-based Python execution

## 🛠 Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AffordableML/catocodeserver.git
   cd catocodeserver
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the database**
   ```bash
   python init_db_fix.py
   ```

5. **Run the server**
   ```bash
   python app.py
   ```

Open your browser and navigate to `http://localhost:5000` to start building!

## 🕹 Platformer Builder

The core of CatoCode is its powerful platformer builder.

- **Viewport Control**: Control the camera FOV (blocks wide) for a custom look.
- **Physics Customization**: Fine-tune player speed, jump power, and gravity.
- **Level Management**: Add, delete, and switch between multiple levels effortlessly.
- **Custom Assets**: Draw your own terrain and characters directly in the browser.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/AffordableML">AffordableML</a>
</p>
