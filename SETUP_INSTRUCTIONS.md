# 🎨 CatoArt - Setup Instructions

A pure client-side pixel art and animation editor. No database, no backend, just pure HTML/CSS/JavaScript!

---

## ✨ Features

- **Pixel Art Editor** - Draw with pen, eraser, fill, and eyedropper tools
- **Multi-Frame Animation** - Create animations with timeline
- **Onion Skinning** - See previous frame while drawing
- **Import Images** - Load images and slice into frames
- **Export** - Save as PNG spritesheet or animated GIF
- **100% Client-Side** - No server needed, works offline

---

## 🚀 Deploy to Cloudflare Pages

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - CatoArt"

# Create a new repository on GitHub (https://github.com/new)
# Then connect it:
git remote add origin https://github.com/YOUR-USERNAME/catoart.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Cloudflare

1. Go to **https://dash.cloudflare.com**
2. Click **"Workers & Pages"**
3. Click **"Create application"** → **"Pages"** tab
4. Click **"Connect to Git"**
5. Select your CatoArt repository
6. Click **"Begin setup"**
7. Configure:
   - **Project name**: `catoart`
   - **Production branch**: `main`
   - **Build command**: (leave empty)
   - **Build output directory**: `/`
8. Click **"Save and Deploy"**

### Step 3: Done!

Your site will be live at: `https://catoart.pages.dev`

---

## 💻 Local Development

### Option 1: Python

```bash
python -m http.server 8000
# or
python3 -m http.server 8000
```

Visit: http://localhost:8000

### Option 2: VS Code Live Server

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 3: Any Static Server

```bash
# Using npx
npx serve

# Using PHP
php -S localhost:8000
```

---

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
└── README.md
```

---

## 🎮 How to Use

### Drawing

1. Click **"START CREATING"** on homepage
2. Select a tool (Pen, Eraser, Fill, Eyedropper)
3. Pick a color from the palette or color picker
4. Draw on the canvas!

### Animation

1. Click **"Add Frame"** to create a new frame
2. Enable **"Show Previous Frame"** for onion skinning
3. Draw your animation frame by frame
4. Click **"Play"** to preview
5. Export as GIF when done

### Import Spritesheet

1. Click **"Import"** button
2. Select an image file
3. Set frame width and height
4. Click **"Import"** to slice into frames
5. Edit or animate the frames

### Export

- **PNG**: Exports all frames as a horizontal spritesheet
- **GIF**: Exports as an animated GIF (requires multiple frames)

---

## 🔧 Customization

### Change Colors

Edit `static/css/style.css` or search for hex codes in HTML files:
- Primary: `#20ffad` (bright green)
- Secondary: `#ff6b6b` (coral red)
- Accent: `#ffc900` (yellow)
- Purple: `#4f46e5` (indigo)

### Change Canvas Sizes

Edit `editor.html` and add more size buttons:
```html
<button onclick="resizeCanvas(128, 128)" class="...">
    128x128
</button>
```

### Change Color Palette

Edit `static/js/editor.js` and modify `defaultPalette` array:
```javascript
const defaultPalette = [
    '#000000', '#FFFFFF', '#FF0000', // Add your colors
];
```

---

## 🔄 Updating Your Site

After making changes:

```bash
git add .
git commit -m "Update description"
git push
```

Cloudflare Pages will automatically redeploy in 1-2 minutes!

---

## 🌐 Custom Domain (Optional)

1. In Cloudflare Pages dashboard, click your project
2. Go to **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter your domain
5. Follow DNS instructions
6. Wait 5-30 minutes for DNS propagation

---

## 💡 Tips

### Performance

- Keep canvas size reasonable (16x16 to 64x64 works best)
- Limit animation frames for smooth playback
- GIF export may take a few seconds for many frames

### Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 not supported

### Keyboard Shortcuts

Currently none, but you can add them by editing `editor.js`:

```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'p') setTool('pen');
    if (e.key === 'e') setTool('eraser');
    // Add more shortcuts
});
```

---

## 🐛 Troubleshooting

### Canvas not showing

- Check browser console (F12) for errors
- Make sure JavaScript is enabled
- Try a different browser

### Import not working

- Make sure image file is valid (PNG, JPG, GIF)
- Check that frame size isn't larger than image
- Try a smaller image first

### GIF export not working

- Make sure you have multiple frames
- Wait a few seconds for processing
- Check browser console for errors
- Try with fewer frames first

### Site not updating after push

- Wait 2-3 minutes for Cloudflare to rebuild
- Check deployment status in Cloudflare dashboard
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache

---

## 📊 Cost

**Everything is FREE!**

- Cloudflare Pages: Free (unlimited bandwidth)
- No database costs
- No API costs
- No server costs

Perfect for personal projects and portfolios!

---

## 🎯 Use Cases

- **Game Development** - Create sprites and animations
- **Pixel Art** - Draw retro-style artwork
- **NFTs** - Create pixel art collections
- **Social Media** - Make animated profile pictures
- **Learning** - Practice pixel art techniques
- **Fun** - Just create cool stuff!

---

## 🔗 Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **GIF.js Library**: https://github.com/jnordberg/gif.js
- **Pixel Art Tutorials**: https://lospec.com/pixel-art-tutorials

---

## 📝 License

MIT License - feel free to use for your own projects!

---

## 🎉 You're Done!

Your pixel art editor is ready to use. Start creating amazing pixel art and animations!

**Happy Creating!** 🎨

