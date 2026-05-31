# FAA Ecosystem - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Code must be in a GitHub repo
3. **Environment Variables**: Prepared from this guide

---

## Step 1: Prepare Your Repository

### Directory Structure
```
your-repo/
├── api/
│   └── index.js              # Enhanced with faa-api-routes.js
├── public/
│   ├── admin-master.html     # Unified admin panel
│   ├── config/
│   │   └── faa-master-config.json
│   ├── js/
│   │   ├── faa-orchestrator.js
│   │   └── faa-wallet-engine.js
│   └── ... (other HTML files)
├── package.json
├── vercel.json
└── README.md
```

### Update `api/index.js`

Add at the end of your existing `api/index.js`:

```javascript
// Import FAA routes
const faaRoutes = require('./faa-api-routes');

// Use FAA routes
app.use('/api', faaRoutes);

// Export the Express app for Vercel
module.exports = app;
```

---

## Step 2: Configure `vercel.json`

Create/update `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/admin",
      "dest": "/public/admin-master.html"
    },
    {
      "src": "/config/(.*)",
      "dest": "/public/config/$1"
    },
    {
      "src": "/js/(.*)",
      "dest": "/public/js/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "FAA_VERSION": "vs111.111",
    "NODE_ENV": "production"
  }
}
```

---

## Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

### Required Variables:
```bash
# PayPal (from your existing setup)
PAYPAL_LIVE_CLIENT_ID=BAAThS_oBJJ22PM5R1nVJ...
PAYPAL_LIVE_CLIENT_SECRET=EFSS4mbIMZ6Q3ijOGCjqA9...
PAYPAL_LIVE_PRODUCT_ID=PROD-2NC51830JC183315X
PAYPAL_WEBHOOK_ID=your_webhook_id_here
PAYPAL_WEBHOOK_SECRET=your_webhook_secret_here

# Session Secret
SESSION_SECRET=generate_strong_random_string_here

# FAA Configuration
FAA_VERSION=vs111.111
FAA_WALLET_ID=FAA-WALLET-001-HS
FAA_NODE_LINK=GEN-ALPHA-ASIVEREIGER

# Frontend URL
FRONTEND_URL=https://seedwave.faa.zone
```

---

## Step 4: Deploy

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - Framework: **Other**
   - Root Directory: **./`
   - Build Command: *(leave empty)*
   - Output Directory: *(leave empty)*
4. Add environment variables
5. Click **Deploy**

---

## Step 5: Configure Custom Domains

### Primary Domain: `seedwave.faa.zone`

1. In Vercel Dashboard → Settings → Domains
2. Add domain: `seedwave.faa.zone`
3. Configure DNS at your domain provider:

```
Type: CNAME
Name: seedwave
Value: cname.vercel-dns.com
```

### Additional Subdomains:

- `admin.faa.zone` → Points to admin-master.html
- `wallet.faa.zone` → Points to wallet interface
- `api.faa.zone` → Points to API endpoints

---

## Step 6: Verify Deployment

### Test Health Endpoint:
```bash
curl https://seedwave.faa.zone/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "vs111.111",
  "trunk_locked": true,
  "timestamp": "2025-01-..."
}
```

### Test Sectors Endpoint:
```bash
curl https://seedwave.faa.zone/api/sectors
```

### Access Admin Panel:
```
https://seedwave.faa.zone/admin
or
https://admin.faa.zone
```

---

## Step 7: Configure PayPal Webhooks

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/webhooks)
2. Create new webhook with URL:
   ```
   https://seedwave.faa.zone/api/paypal/webhook
   ```
3. Select events:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `PAYMENT.SALE.COMPLETED`
4. Copy Webhook ID and save to Vercel env vars

---

## Troubleshooting

### API Routes Not Working

Check `vercel.json` routes configuration. Ensure `/api/(.*)` comes before `/(.*)`

### Environment Variables Not Loading

1. Check they're set in Vercel Dashboard
2. Redeploy after adding new variables
3. Check variable names match exactly

### Build Failures

```bash
# Check logs
vercel logs

# Test locally
vercel dev
```

### PayPal Integration Issues

1. Verify credentials are LIVE (not sandbox)
2. Check webhook URL is accessible
3. Verify webhook secret matches

---

## Performance Optimization

### Enable Caching

Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/config/faa-master-config.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=3600"
        }
      ]
    }
  ]
}
```

### Enable Compression

Vercel automatically compresses responses. Verify:
```bash
curl -H "Accept-Encoding: gzip" https://seedwave.faa.zone/api/health
```

---

## Monitoring

### Vercel Analytics

Enable in Dashboard → Analytics

### Custom Monitoring

Track:
- API response times
- Payment success rates
- Node pulse frequency
- License generation count

---

## Rollback

If deployment fails:

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

---

## Success Checklist

- [ ] Repository deployed to Vercel
- [ ] All environment variables set
- [ ] Custom domains configured
- [ ] DNS records updated
- [ ] Health endpoint responding
- [ ] Admin panel accessible
- [ ] PayPal webhooks configured
- [ ] Test payment processed successfully
- [ ] All 31 sectors visible in admin
- [ ] Node status showing 7,038 nodes
- [ ] Wallet integration working

---

**Deployment Status: READY FOR PRODUCTION** 🚀
