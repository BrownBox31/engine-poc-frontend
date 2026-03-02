# Vercel Deployment Guide

This guide will help you deploy your Vehicle Inspection Expert application to Vercel via GitHub.

## Prerequisites

1. **GitHub Account**: Ensure your project is pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account
3. **API Backend**: Have your backend API deployed and accessible

## Step-by-Step Deployment Process

### 1. Prepare Your Repository

Ensure all files are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your `vehicle_inspection_expert_rework` repository
4. Vercel will automatically detect it's a Vite project

### 3. Configure Environment Variables

In the Vercel dashboard, add the following environment variable:

- **Variable Name**: `VITE_API_BASE_URL`
- **Value**: Your production API base URL (e.g., `https://your-api.com/api`)

### 4. Deploy Settings

Vercel should automatically detect:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. Deploy

1. Click "Deploy"
2. Wait for the build process to complete (usually 1-3 minutes)
3. Once deployed, you'll get a production URL

## Environment Variables Reference

Create a `.env` file locally for development (don't commit this):

```bash
# Copy from .env.example and fill in your values
VITE_API_BASE_URL=https://your-production-api.com/api
```

## Build Verification

Test your build locally before deploying:

```bash
npm run build
npm run preview
```

## Automatic Deployments

Once connected:
- Every push to `main` branch triggers a production deployment
- Pull requests create preview deployments
- You can configure branch deployments in Vercel settings

## Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **API Calls Fail**: Verify `VITE_API_BASE_URL` environment variable
3. **Routing Issues**: The `vercel.json` file handles SPA routing
4. **Environment Variables**: Ensure they start with `VITE_` prefix

### Build Logs:
- Check Vercel deployment logs for detailed error messages
- Ensure your build passes locally with `npm run build`

## Security Considerations

- Never commit `.env` files with sensitive data
- Use environment variables for all API endpoints
- The `vercel.json` includes security headers
- Consider enabling Vercel's security features

## Performance Optimization

Your `vite.config.ts` includes:
- Code splitting for better loading
- Vendor chunk separation
- Optimized build settings

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router with Vercel](https://vercel.com/guides/deploying-react-with-vercel)
