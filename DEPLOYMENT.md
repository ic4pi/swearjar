# Deployment Guide

## Option 1: Vercel (Frontend) + Render (Backend) - Recommended

### Step 1: Deploy Backend to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up for free account

2. **Connect GitHub**
   - Connect your GitHub repository
   - Select the `backend` folder or create a separate repo

3. **Configure Web Service**
   - Service Type: Web Service
   - Name: zack-tippett-api
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free ($0/month)

4. **Environment Variables**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your API URL: `https://your-service-name.onrender.com`

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Select your repository
   - Root Directory: `.` (project root)

3. **Configure Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables**
   Add the backend URL:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (1-2 minutes)
   - Your site will be live at `https://your-project-name.vercel.app`

### Step 3: Update API Configuration

Update `src/lib/api-config.ts` with your Render URL:

```typescript
export const API_BASE = 'https://your-backend-url.onrender.com/api';
```

## Option 2: Railway (Full Stack) - Alternative

### Deploy Both Backend and Frontend on Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   - New Project → Deploy from GitHub repo
   - Select your repository
   - Set path to `backend` folder
   - Add environment variables

3. **Deploy Frontend**
   - Add another service to same project
   - Set path to project root
   - Configure as static site

## Option 3: Vercel Serverless - Backend + Frontend Together

### Deploy Everything on Vercel

1. **Move Backend to Root**
   - Copy `backend/server.js` to `api/` folder in root
   - Copy `backend/package.json` dependencies to root `package.json`

2. **Update Vercel Config**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": { "distDir": "dist" }
       },
       {
         "src": "api/**/*.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/api/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/$1"
       }
     ]
   }
   ```

## Testing Production

1. **Test API**
   ```bash
   curl https://your-backend-url.onrender.com/api/shows
   ```

2. **Test Frontend**
   - Visit your Vercel URL
   - Try admin dashboard: `Ctrl + Tab + Down Arrow`
   - Login with `admin` and the password printed to the server log on first run (or your `ADMIN_DEFAULT_PASSWORD`)

3. **Test Admin Functions**
   - Add a show
   - Update product
   - Check if data persists

## Post-Deployment

### Security Checklist
- [ ] Change default admin password
- [ ] Update JWT_SECRET to something secure
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up custom domain (optional)

### Performance
- [ ] Monitor API response times
- [ ] Check database size limits
- [ ] Set up CDN for images if needed

### Backup
- [ ] Export database regularly
- [ ] Keep local copy of content
- [ ] Set up monitoring alerts

## Cost Summary

**Free Tier Limits:**
- **Render**: 750 hours/month, 100GB bandwidth
- **Vercel**: 100GB bandwidth, unlimited projects
- **Railway**: $5/month after free credits, 500 hours

**Recommendation:** Start with Render + Vercel (both free tiers), upgrade as needed.

## Troubleshooting

**Common Issues:**
1. **CORS errors** - Update backend CORS settings
2. **Database errors** - Check file permissions on Railway
3. **Build failures** - Verify all dependencies in package.json
4. **API timeouts** - Free tiers have cold starts (30-60 seconds)

**Support:**
- Check deployment logs
- Test API endpoints directly
- Verify environment variables
- Monitor error dashboards
