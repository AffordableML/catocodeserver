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
</p>

---

## ✨ Features

CatoCode is a comprehensive web-based development environment designed for creators, developers, and data scientists.

*   📁 **Project Management**: Organize your code projects and games in a centralized dashboard.
*   🌍 **One-Click Publishing**: Share your creations with the world instantly.
*   🛠️ **Custom Tile & Sound Engine**: Design your own pixel art tiles.
*   🎨 **Pixel Editor**: Draw animations and share them with links for others to remix.

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

### Demo Account

A demo account has been pre-created:

- **Username**: `meep`
- **Password**: `meep`

You can also register a new account through the registration page.

<p align="center">
  Built with ❤️ by <a href="https://github.com/AffordableML">AffordableML</a>
</p>
