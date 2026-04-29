---
name: trip-deployer
description: >
  Deploy a generated trip plan HTML as a live website. Use when the user has a completed trip plan
  (index.html + style.css + app.js + data/trip.json) and wants to publish it online. Triggers on
  "deploy my trip plan", "publish the trip", "make it a website", "share it online", "put it on
  GitHub Pages", "host the trip plan", or when the trip-planner workflow reaches Phase 6.
---

# Trip Deployer

Deploy a generated trip plan as a live website the user can share with travel companions.

Proactively offer to help after HTML generation:
"Your trip plan is ready! Want me to help you publish it as a live website you can share?"

Present these options (from easiest to most flexible) using `AskUserQuestion`. The four options below fit within the 4-option limit; if a 5th provider is ever added, switch to a markdown list + free-text reply instead. See [../trip-planner/references/ask-user-question-rules.md](../trip-planner/references/ask-user-question-rules.md).

## Option A: GitHub Pages (Recommended -- Free, No Account Setup if they have GitHub)

Zero cost, custom domain support, version-controlled so they can update later.

**Step-by-step guide to present to the user:**

1. **Create a GitHub repo**
   ```
   Go to github.com/new and create a new repository
   Name it my-trip-plan (or any name you like)
   Select Public (free tier only supports GitHub Pages with public repos)
   Check "Add a README file"
   ```

2. **Upload files**
   ```
   On the repo page, click "Add file" -> "Upload files"
   Drag the entire folder's files in:
     - index.html
     - style.css
     - app.js
     - data/trip.json
   Click "Commit changes"
   ```

3. **Enable GitHub Pages**
   ```
   Go to repo Settings -> Pages (left sidebar)
   Source: select "Deploy from a branch"
   Branch: select "main", folder: select "/ (root)"
   Click Save
   ```

4. **Wait 1-2 minutes and your site is live!**
   ```
   URL will be: https://your-username.github.io/my-trip-plan/
   You can open it on your phone or share it with travel companions!
   ```

**Optional: Use Claude to automate it** -- if the user has `gh` CLI installed, offer to run:
```bash
cd {output-folder}
gh repo create {destination}-trip --public --source=. --remote=origin --push
# Then guide them to enable Pages in Settings
```

## Option B: Netlify Drop (Easiest -- No Account Needed for Quick Share)

Best for users who just want a quick shareable link without any setup.

```
1. Open https://app.netlify.com/drop
2. Drag your entire trip plan folder into it
3. You'll get a URL in seconds!
4. URL looks like: https://random-name-1234.netlify.app

Note: Free tier sites expire after 1 hour. For permanent hosting, register a Netlify account (free)
```

## Option C: Vercel (Great for Tech-Savvy Users)

```
1. Go to vercel.com and sign in with GitHub
2. Click "Add New" -> "Project"
3. Import the repo you just uploaded to GitHub
4. Framework Preset: select "Other"
5. Click Deploy
6. You'll have a URL in seconds! HTTPS included automatically
```

## Option D: Cloudflare Pages (Free, Fast, Unlimited Bandwidth)

```
1. Go to pages.cloudflare.com and sign up/sign in
2. Click "Create a project" -> "Direct Upload"
3. Choose a project name
4. Drag the folder into the upload area
5. Click Deploy
6. URL: https://your-project-name.pages.dev
```

## After Deployment

Remind the user:
- **Share the link** -- send the URL to your travel companions, viewable on mobile too
- **Update the plan** -- just re-upload after editing the HTML (GitHub Pages auto-updates)
- **Custom domain** -- both GitHub Pages and Netlify support free custom domain setup
- **Works offline** -- since the HTML is self-contained, save it on your phone and it works without internet

## Generating a Deploy-Ready Package

When generating the output files, also create a simple `README.md` in the output folder:

```markdown
# {Destination} Trip Plan {Year}

Interactive travel guide -- open `index.html` in your browser or deploy as a website.

## Deploy to GitHub Pages
1. Create a new repo on GitHub
2. Upload all files in this folder
3. Go to Settings -> Pages -> Deploy from branch (main)
4. Your site will be live at `https://<username>.github.io/<repo-name>/`
```
