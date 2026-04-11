# 🎨 CatoArt - Pixel Art & Animation Editor

A powerful, pure client-side pixel art and animation editor. Create sprites, animate characters, import spritesheets, and export as PNG or GIF—all in your browser!

## ✨ Features

- 🎨 **Pixel Art Tools** - Pen, eraser, fill, and eyedropper
- 🎬 **Multi-Frame Animation** - Create smooth animations with timeline
- 👻 **Onion Skinning** - See previous frame while drawing
- 📥 **Import & Slice** - Load images and slice into frames
- 📤 **Export** - Save as PNG spritesheet or animated GIF
- 🚀 **100% Client-Side** - No server, no database, works offline
- 📱 **Responsive** - Works on desktop and mobile

## 🚀 Quick Start

### Deploy to Cloudflare Pages

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/catoart.git
git push -u origin main
```

2. **Deploy:**
   - Go to https://dash.cloudflare.com
   - Workers & Pages → Create → Pages → Connect to Git
   - Select your repo
   - Build command: (leave empty)
   - Build output: `/`
   - Deploy!

3. **Done!** Your site is live at `https://catoart.pages.dev`

### Local Development

```bash
# Python
python -m http.server 8000

# Or use any static server
npx serve
```

Visit: http://localhost:8000

## 🎮 How to Use

### Drawing
1. Select a tool (Pen, Eraser, Fill, Eyedropper)
2. Pick a color from palette or color picker
3. Draw on the canvas!

### Animation
1. Click "Add Frame" to create new frames
2. Enable "Show Previous Frame" for onion skinning
3. Draw frame by frame
4. Click "Play" to preview
5. Export as GIF

### Import Spritesheet
1. Click "Import" button
2. Select an image file
3. Set frame width and height
4. Slice into frames automatically

### Export
- **PNG** - Horizontal spritesheet of all frames
- **GIF** - Animated GIF (requires 2+ frames)

## 📁 Project Structure

```
CatoArt/
├── index.html              # Homepage
├── editor.html             # Pixel art editor
├── static/
│   ├── css/
│   │   └── style.css      # Neo-brutalist styles
│   └── js/
│       └── editor.js      # Editor logic
├── SETUP_INSTRUCTIONS.md  # Detailed setup guide
└── README.md
```

## 🛠️ Tech Stack

- **HTML5 Canvas** - For pixel-perfect rendering
- **Vanilla JavaScript** - No frameworks, pure JS
- **Tailwind CSS** - Utility-first styling
- **GIF.js** - Animated GIF export
- **Cloudflare Pages** - Free hosting

## 🎨 Design

Neo-brutalist design with:
- Bold borders and shadows
- Bright color palette (#20ffad, #ff6b6b, #ffc900)
- Playful animations
- Dotted background pattern
- Nunito font family

## 💡 Use Cases

- **Game Development** - Create sprites and animations
- **Pixel Art** - Draw retro-style artwork
- **NFTs** - Create pixel art collections
- **Social Media** - Animated profile pictures
- **Learning** - Practice pixel art
- **Fun** - Just create!

## 🔧 Customization

### Add Canvas Sizes

Edit `editor.html`:
```html
<button onclick="resizeCanvas(128, 128)">128x128</button>
```

### Change Color Palette

Edit `static/js/editor.js`:
```javascript
const defaultPalette = [
    '#000000', '#FFFFFF', '#FF0000', // Your colors
];
```

### Add Keyboard Shortcuts

Edit `static/js/editor.js`:
```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'p') setTool('pen');
    if (e.key === 'e') setTool('eraser');
});
```

## 🔄 Updating

```bash
git add .
git commit -m "Update"
git push
```

Cloudflare auto-deploys in 1-2 minutes!

## 💰 Cost

**FREE!** No costs at all:
- ✅ Cloudflare Pages: Free hosting
- ✅ No database costs
- ✅ No API costs
- ✅ No server costs

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 not supported

## 📝 License

MIT License - Use freely for any project!

## 🎯 Roadmap

- [x] Pixel art editor
- [x] Multi-frame animation
- [x] Onion skinning
- [x] Import images
- [x] Slice spritesheets
- [x] Export PNG
- [x] Export GIF
- [ ] Keyboard shortcuts
- [ ] Undo/Redo
- [ ] Layers
- [ ] Custom brushes

## 🆘 Support

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed help and troubleshooting.

---

**Made with ❤️ for pixel artists**

🎨 **Start creating amazing pixel art today!**

