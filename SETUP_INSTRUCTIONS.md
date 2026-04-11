# 📖 CatoArt - Complete Setup Instructions

This guide will walk you through setting up CatoArt from scratch. Follow each step carefully.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development](#local-development)
4. [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

### What You Need

- **A computer** with internet access
- **A web browser** (Chrome, Firefox, Safari, or Edge)
- **A GitHub account** (free) - https://github.com/signup
- **A Supabase account** (free) - https://supabase.com
- **A Cloudflare account** (free) - https://cloudflare.com
- **Git installed** (optional for local development)

### What You DON'T Need

- ❌ No Node.js or npm
- ❌ No build tools
- ❌ No backend server
- ❌ No Docker or containers
- ❌ No complicated setup

---

## Supabase Setup

Supabase provides your database and authentication. This takes about 5 minutes.

### Step 1: Create a Supabase Project

1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign In"** if you have an account
3. Click **"New Project"**
4. Fill in the project details:
   - **Organization**: Select or create one
   - **Name**: `CatoArt` (or any name you prefer)
   - **Database Password**: Create a strong password
     - ⚠️ **IMPORTANT**: Save this password somewhere safe!
     - You'll need it if you ever want to connect directly to the database
   - **Region**: Choose the region closest to your users
     - US East, EU West, Asia Southeast, etc.
   - **Pricing Plan**: Free (perfect for getting started)
5. Click **"Create new project"**
6. Wait 2-3 minutes while Supabase sets up your database

### Step 2: Get Your Project URL

1. Once your project is ready, you'll see the dashboard
2. Look at your browser's address bar
3. Your project URL is: `https://YOUR-PROJECT-ID.supabase.co`
4. The project ID is in the URL (e.g., `bpjukhopjkbdfeuhzdvv`)
5. Keep this tab open - you'll need it!

### Step 3: Run SQL Commands

Now we'll create the database tables and security policies.

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - It has a `</>` icon
2. Click **"New Query"** button (top right)
3. Open the file `SUPABASE_COMMANDS.sql` in your CatoArt project folder
4. Select **ALL** the SQL code (Ctrl+A or Cmd+A)
5. Copy it (Ctrl+C or Cmd+C)
6. Go back to Supabase SQL Editor
7. Paste the code (Ctrl+V or Cmd+V)
8. Click **"Run"** button (or press Ctrl+Enter)
9. You should see: **"Success. No rows returned"**
   - This is good! It means the tables were created

**What did this do?**
- Created 4 tables: `users`, `artworks`, `likes`, `remixes`
- Set up indexes for fast queries
- Enabled Row Level Security (RLS) for data protection
- Created security policies so users can only modify their own data

### Step 4: Get Your Anon Key

The anon key is a public key that allows your frontend to talk to Supabase.

1. In Supabase dashboard, click **"Settings"** (gear icon at bottom left)
2. Click **"API"** in the settings menu
3. Scroll down to **"Project API keys"** section
4. You'll see two keys:
   - **anon public** - This is what you need! ✅
   - **service_role** - DO NOT use this in frontend! ⚠️
5. Click the **copy icon** next to the **anon public** key
6. The key is a long string starting with `eyJ...`
7. Keep this copied - you'll paste it in the next step

### Step 5: Update Configuration File

Now we'll add your Supabase credentials to the project.

1. Open your CatoArt project folder
2. Navigate to `static/js/config.js`
3. Open it in any text editor
4. You'll see:
   ```javascript
   const SUPABASE_URL = 'https://bpjukhopjkbdfeuhzdvv.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ANON_KEY_HERE';
   ```
5. Replace the URL with your project URL from Step 2
6. Replace the entire ANON_KEY with the key you copied in Step 4
7. Save the file

**Example:**
```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxOTI1MDM1MjAwfQ.abcdefghijklmnopqrstuvwxyz1234567890';
```

✅ **Supabase setup complete!**

---

## Local Development

Test your site locally before deploying.

### Option 1: Python (Easiest)

If you have Python installed:

```bash
# Navigate to your project folder
cd /path/to/catoart

# Start server
python -m http.server 8000

# Or on some systems:
python3 -m http.server 8000
```

Visit: **http://localhost:8000**

### Option 2: Using the Provided Script

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run it
./start.sh
```

Visit: **http://localhost:8000**

### Option 3: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 4: Any Static Server

```bash
# Using npx (if you have Node.js)
npx serve

# Using PHP
php -S localhost:8000
```

### Test Locally

1. **Homepage loads** - You should see the CatoArt homepage
2. **Click "START DRAWING"** - Editor should open
3. **Draw something** - Test the drawing tools
4. **Click "Save"** - Should save and show share link
5. **Test the share link** - Should display your artwork
6. **Sign up** - Create a test account
7. **Check email** - Verify your account
8. **Login** - Should redirect to dashboard

If everything works locally, you're ready to deploy!

---

## Cloudflare Pages Deployment

Deploy your site to the internet for free!

### Step 1: Prepare Your Code

Make sure your `static/js/config.js` has the correct Supabase credentials.

### Step 2: Push to GitHub

#### If you don't have Git installed:

1. Go to **https://github.com/new**
2. Create a new repository named `catoart`
3. Click **"uploading an existing file"**
4. Drag and drop all your project files
5. Click **"Commit changes"**

#### If you have Git installed:

```bash
# Navigate to your project folder
cd /path/to/catoart

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - CatoArt ready for deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then connect it:
git remote add origin https://github.com/YOUR-USERNAME/catoart.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Connect to Cloudflare Pages

1. Go to **https://dash.cloudflare.com**
2. Log in or create a free account
3. Click **"Workers & Pages"** in the left sidebar
4. Click **"Create application"** button
5. Click the **"Pages"** tab
6. Click **"Connect to Git"**

### Step 4: Authorize GitHub

1. Click **"Connect GitHub"**
2. Authorize Cloudflare to access your repositories
3. You can choose to give access to all repos or just select ones

### Step 5: Select Repository

1. Find your `catoart` repository in the list
2. Click **"Begin setup"**

### Step 6: Configure Build Settings

This is important! Use these exact settings:

- **Project name**: `catoart` (or your preferred name)
  - This will be your URL: `https://catoart.pages.dev`
- **Production branch**: `main`
- **Framework preset**: None
- **Build command**: (leave empty - no build needed!)
- **Build output directory**: `/` (just a forward slash)
- **Root directory**: (leave empty)

### Step 7: Deploy

1. Click **"Save and Deploy"**
2. Cloudflare will start deploying your site
3. This takes 1-2 minutes
4. You'll see a progress indicator

### Step 8: Get Your URL

1. Once deployment is complete, you'll see a success message
2. Your site URL will be shown: `https://catoart.pages.dev`
3. Click the URL to visit your live site!

✅ **Your site is now live on the internet!**

---

## Testing

Test all features to make sure everything works.

### Test 1: Anonymous Drawing

1. Visit your site URL
2. Click **"START DRAWING"**
3. Draw something with the pixel art tools
4. Click **"Save"**
5. You should get a share link
6. Copy the share link
7. Open it in a new tab or incognito window
8. Artwork should display
9. Author should show **"Anonymous"**
10. Username should NOT be clickable

✅ **Anonymous drawing works!**

### Test 2: User Registration

1. Go to your homepage
2. Click **"LOGIN"**
3. Click **"Sign up here"** at the bottom
4. Fill in:
   - Email address
   - Username (unique)
   - Password (min 6 characters)
5. Click **"Sign Up"**
6. Check your email inbox
7. Click the verification link in the email
8. You should be redirected back to your site

✅ **Registration works!**

### Test 3: User Login

1. Go to homepage
2. Click **"LOGIN"**
3. Enter your email and password
4. Click **"Login"**
5. Should redirect to dashboard
6. Dashboard should show your username

✅ **Login works!**

### Test 4: Create Artwork (Logged In)

1. From dashboard, click **"New Art"**
2. Draw something
3. Give it a title
4. Click **"Save"**
5. Should redirect to artwork view page
6. Your username should appear as author
7. Username should be clickable

✅ **Logged-in artwork creation works!**

### Test 5: Profile Page

1. Click on your username on any artwork
2. Should go to your profile page
3. Should show:
   - Your username
   - Member since date
   - Stats (artworks, likes, remixes)
   - Grid of your public artworks
4. Click on an artwork - should go to view page

✅ **Profile page works!**

### Test 6: Like System

1. View any artwork
2. Click **"Like"** button
3. Like count should increase
4. Button should change to **"Unlike"**
5. Click **"Unlike"**
6. Like count should decrease
7. Button should change back to **"Like"**

✅ **Like system works!**

### Test 7: Remix System

1. View any artwork
2. Click **"Remix"** button
3. Editor should open with the artwork loaded
4. Title should say "Remix of [original title]"
5. Modify the artwork
6. Click **"Save"**
7. Should create a new artwork
8. Go back to original artwork
9. Should see your remix in the "Remixes" section

✅ **Remix system works!**

### Test 8: Gallery

1. Go to homepage
2. Scroll down to gallery section
3. Should see recent artworks
4. Click **"VIEW ALL"**
5. Should go to full gallery page
6. Test filters: Recent, Popular, Most Remixed
7. Click **"Load More"** if available
8. Click on any artwork to view it

✅ **Gallery works!**

### Test 9: Dashboard

1. Login and go to dashboard
2. Should see:
   - Your username
   - Stats cards (artworks, likes, remixes, public)
   - Grid of your artworks
3. Click **"Edit"** on an artwork
4. Should open in editor
5. Make changes and save
6. Click delete button on an artwork
7. Confirm deletion
8. Artwork should disappear

✅ **Dashboard works!**

### Test 10: Export

1. Create or edit an artwork
2. Click **"Export"** button
3. Should download a PNG file
4. Open the PNG - should be your artwork
5. Image should be pixel-perfect (not blurry)

✅ **Export works!**

---

## Troubleshooting

### Issue: "Invalid API key" Error

**Symptoms:**
- Can't save artworks
- Can't login/register
- Console shows "Invalid API key"

**Solution:**
1. Open `static/js/config.js`
2. Check that `SUPABASE_ANON_KEY` is correct
3. Make sure you copied the full key (it's very long)
4. Verify you used the **anon public** key, not service_role
5. Check that `SUPABASE_URL` matches your project
6. Save the file and redeploy

### Issue: "Failed to fetch" Error

**Symptoms:**
- Nothing loads
- Console shows "Failed to fetch"

**Solution:**
1. Check your internet connection
2. Verify Supabase project is active (not paused)
3. Check Supabase dashboard for any issues
4. Try opening Supabase URL in browser: `https://YOUR-PROJECT.supabase.co`
5. Check browser console for CORS errors

### Issue: SQL Errors in Supabase

**Symptoms:**
- SQL commands fail
- Tables not created
- Policies not working

**Solution:**
1. Go to Supabase SQL Editor
2. Run this to check tables:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. If tables are missing, run `SUPABASE_COMMANDS.sql` again
4. If you get "already exists" errors, that's OK - tables are there
5. Check Supabase logs: Dashboard → Logs

### Issue: Can't Save Artworks

**Symptoms:**
- Click "Save" but nothing happens
- Console shows errors

**Solution:**
1. Open browser console (F12)
2. Look for specific error messages
3. Common causes:
   - Invalid API key (see above)
   - RLS policies not set up (run SQL commands again)
   - Not logged in (for editing existing artworks)
4. Try saving as anonymous first
5. Then try saving while logged in

### Issue: Email Verification Not Working

**Symptoms:**
- Don't receive verification email
- Email link doesn't work

**Solution:**
1. Check spam/junk folder
2. Wait a few minutes (can be delayed)
3. In Supabase dashboard:
   - Go to Authentication → Users
   - Find your user
   - Click the three dots → Confirm user
4. Try registering with a different email
5. Check Supabase email settings: Authentication → Email Templates

### Issue: Artworks Not Showing in Gallery

**Symptoms:**
- Gallery is empty
- Your artworks don't appear

**Solution:**
1. Check if artworks are set to public:
   - Go to dashboard
   - Look for public/private indicator
   - Edit artwork and make it public
2. Check browser console for errors
3. Try refreshing the page
4. Check Supabase: Table Editor → artworks → verify `is_public = true`

### Issue: Profile Page Not Loading

**Symptoms:**
- Clicking username does nothing
- Profile page shows error

**Solution:**
1. Make sure you're clicking a registered user's name
2. Anonymous artworks don't have clickable names
3. Check browser console for errors
4. Verify user exists in Supabase: Table Editor → users

### Issue: Cloudflare Deployment Fails

**Symptoms:**
- Deployment shows errors
- Site doesn't load

**Solution:**
1. Check build settings:
   - Build command should be empty
   - Build output should be `/`
2. Make sure all files are in GitHub
3. Check Cloudflare deployment logs
4. Try redeploying: Deployments → Retry deployment
5. Verify `index.html` is in root directory

### Issue: Site Works Locally But Not on Cloudflare

**Symptoms:**
- Works on localhost
- Broken on live site

**Solution:**
1. Check that you pushed latest changes to GitHub
2. Verify `static/js/config.js` has correct credentials
3. Check browser console on live site
4. Make sure you're using HTTPS URLs (not HTTP)
5. Clear browser cache and try again

### Issue: Can't Edit Anonymous Artworks

**Symptoms:**
- Created artwork anonymously
- Can't edit it later

**Solution:**
- This is expected behavior!
- Anonymous artworks can't be edited
- They're permanent once saved
- Sign up to manage your artworks
- You can still remix anonymous artworks

---

## Advanced Configuration

### Custom Domain

Want to use your own domain instead of `.pages.dev`?

1. In Cloudflare Pages dashboard, click your project
2. Go to **"Custom domains"** tab
3. Click **"Set up a custom domain"**
4. Enter your domain (e.g., `myart.com`)
5. Follow DNS instructions
6. Wait 5-30 minutes for DNS propagation
7. Your site will be available at your custom domain!

### Environment-Specific Config

Want different settings for development vs production?

1. Create `static/js/config.dev.js`:
   ```javascript
   const SUPABASE_URL = 'http://localhost:54321'; // Local Supabase
   const SUPABASE_ANON_KEY = 'your-local-key';
   ```

2. Create `static/js/config.prod.js`:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-production-key';
   ```

3. Update `index.html` to load the right config

### Analytics

Want to track visitors?

1. Add Cloudflare Web Analytics:
   - Cloudflare dashboard → Analytics → Web Analytics
   - Add your site
   - Copy the script tag
   - Add to `index.html` before `</body>`

2. Or use Google Analytics:
   - Create GA4 property
   - Copy tracking code
   - Add to all HTML files

### Custom Styling

Want to change colors or fonts?

1. Open `static/css/style.css`
2. Modify CSS variables or classes
3. Colors are defined throughout the HTML files
4. Search for hex codes like `#20ffad` to change colors
5. Font is Nunito - change in HTML `<head>` sections

### Database Backups

Protect your data:

1. Supabase dashboard → Database → Backups
2. Free tier: Daily backups (7 days retention)
3. Pro tier: Point-in-time recovery
4. Manual backup:
   - Database → SQL Editor
   - Run: `pg_dump` commands
   - Save output

### Monitoring

Keep an eye on your site:

1. **Supabase Dashboard:**
   - Database size: Database → Database
   - API requests: Home → API requests chart
   - Active users: Authentication → Users

2. **Cloudflare Dashboard:**
   - Bandwidth: Analytics → Web Analytics
   - Requests: Analytics → Performance
   - Errors: Pages project → Deployments → Logs

### Scaling

When you outgrow free tier:

1. **Supabase Pro** ($25/month):
   - 8GB database (vs 500MB)
   - 100K monthly active users (vs 50K)
   - 50GB bandwidth (vs 2GB)
   - Daily backups (vs weekly)

2. **Cloudflare Pages** (still free!):
   - Unlimited bandwidth
   - Unlimited requests
   - 500 builds/month

---

## Security Best Practices

### What's Safe

✅ **Anon key in frontend** - Designed to be public
✅ **Supabase URL** - Public by design
✅ **User emails** - Protected by RLS
✅ **Artwork data** - Protected by RLS

### What's NOT Safe

❌ **Service role key** - Never use in frontend!
❌ **Database password** - Keep it secret!
❌ **Admin credentials** - Don't share!

### RLS Policies

Your data is protected by Row Level Security:

- Users can only edit their own profile
- Users can only edit/delete their own artworks
- Users can only create/delete their own likes
- Anonymous artworks are read-only
- Public artworks are visible to everyone

### Email Verification

Users must verify their email before they can:
- Login
- Create artworks (while logged in)
- Like artworks
- Remix artworks

---

## Getting Help

### Documentation

- **This guide** - You're reading it!
- **Supabase Docs**: https://supabase.com/docs
- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages

### Check Logs

1. **Browser Console** (F12):
   - See JavaScript errors
   - Check network requests
   - View API responses

2. **Supabase Logs**:
   - Dashboard → Logs
   - See database queries
   - Check auth events

3. **Cloudflare Logs**:
   - Pages project → Deployments
   - Click on a deployment
   - View build logs

### Common Commands

```bash
# Check git status
git status

# See recent commits
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Deploy updates
git add .
git commit -m "Update"
git push

# Start local server
python -m http.server 8000
```

---

## Next Steps

Now that your site is set up:

1. **Customize the design** - Edit colors, fonts, layout
2. **Add features** - The code is yours to modify!
3. **Share with friends** - Get feedback
4. **Create amazing art** - That's what it's for!
5. **Build a community** - Invite artists to join

---

## Quick Reference

### Important URLs

- **Your Site**: `https://YOUR-PROJECT.pages.dev`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub Repo**: `https://github.com/YOUR-USERNAME/catoart`

### Important Files

- `static/js/config.js` - Supabase credentials
- `SUPABASE_COMMANDS.sql` - Database setup
- `static/css/style.css` - Styling
- `index.html` - Homepage
- `editor.html` - Pixel art editor

### Useful Commands

```bash
# Local development
python -m http.server 8000

# Deploy updates
git add . && git commit -m "Update" && git push

# Check status
git status
```

---

## Success Checklist

Before you're done, make sure:

- ✅ Supabase project created
- ✅ SQL commands executed successfully
- ✅ Anon key added to `config.js`
- ✅ Code pushed to GitHub
- ✅ Deployed to Cloudflare Pages
- ✅ Site loads at your URL
- ✅ Anonymous drawing works
- ✅ User registration works
- ✅ Login works
- ✅ Dashboard works
- ✅ Gallery works
- ✅ Like/remix works
- ✅ Profile pages work

---

**🎉 Congratulations! Your pixel art platform is ready!**

Have fun creating and sharing amazing pixel art! 🎨

