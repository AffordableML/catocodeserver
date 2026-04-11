# CatoArt - Pixel Art Community Platform

A modern pixel art editor and community platform built with static HTML and Supabase. Deploy anywhere - Cloudflare Pages, GitHub Pages, Netlify, or any static host!

## ✨ Features

- 🎨 **Pixel Art Editor** - Draw and animate pixel art
- 👥 **User Accounts** - Sign up with email
- 🖼️ **Community Gallery** - Share and discover artwork
- ❤️ **Like System** - Like your favorite pieces
- 🔄 **Remix** - Build on others' work
- 📱 **Fully Responsive** - Works on all devices
- ⚡ **Static Site** - Deploy anywhere, no server needed!

## 🚀 Quick Start

### 1. Setup Supabase

Follow the detailed instructions in [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

Quick summary:
1. Run SQL commands in Supabase SQL Editor
2. Get your anon key from Supabase Dashboard
3. Update `static/js/config.js` with your anon key

### 2. Deploy

**Cloudflare Pages:**
```bash
git push origin main
# Connect repo in Cloudflare Pages dashboard
```

**GitHub Pages:**
```bash
git push origin main
# Enable Pages in repo settings
```

**Local Development:**
```bash
# Use any static server
python -m http.server 8000
# or
npx serve
```

## 📁 Project Structure

```
CatoArt/
├── index.html           # Homepage with gallery preview
├── login.html           # Login page
├── register.html        # Sign up page
├── dashboard.html       # User dashboard (coming)
├── gallery.html         # Full gallery (coming)
├── editor.html          # Pixel art editor (coming)
├── view.html            # View artwork (coming)
├── static/
│   ├── css/
│   │   └── style.css    # Neo-brutalist styles
│   └── js/
│       ├── config.js    # Supabase config
│       ├── auth.js      # Auth functions
│       └── main.js      # Homepage logic
└── SETUP_INSTRUCTIONS.md
```

## 🛠️ Tech Stack

- **Frontend**: Pure HTML, CSS (Tailwind), Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Static (Cloudflare Pages, GitHub Pages, etc.)
- **No Build Step**: Deploy directly!

## 🎨 Design

Neo-brutalist design with:
- Bold borders and shadows
- Bright color palette
- Playful animations
- Dotted background pattern
- Nunito font family

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- Public artworks visible to all
- Private artworks only visible to owner

## 📊 Database Schema

### Tables
- `users` - User profiles
- `artworks` - Pixel art creations
- `likes` - Artwork likes
- `remixes` - Remix tracking

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for full schema.

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 📝 License

MIT License - feel free to use for your own projects!

## 🎯 Roadmap

- [x] User authentication
- [x] Homepage with gallery
- [x] Login/Register pages
- [x] Dashboard page
- [x] Full gallery page
- [x] Pixel art editor
- [x] View artwork page
- [x] Like functionality
- [x] Remix functionality
- [x] Thumbnail generation
- [x] Export as PNG/GIF

**All features complete!** 🎉

## 💡 Why Static?

- ✅ Deploy anywhere
- ✅ No server costs
- ✅ Instant global CDN
- ✅ Simple to maintain
- ✅ Scales automatically
- ✅ Fast performance

## 🆘 Support

Check [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed setup help and troubleshooting.

---

Made with ❤️ for pixel artists
