# Backend Deployment Guide

## 🚀 Automatic Deployment

Every push to `main` branch automatically:
1. ✅ Backs up database (timestamped)
2. ✅ Rebuilds backend Docker image
3. ✅ Restarts container (preserves data)
4. ✅ Attempts to run import script
5. ⚠️ Import may fail if API token is invalid

## 🔧 First-Time Setup

After first deployment, the API token needs to be configured:

### Step 1: Access Strapi Admin
```bash
https://kioskapi.gandom-perfume.ir/admin
```

### Step 2: Generate API Token
1. Login to admin panel
2. Go to **Settings** → **API Tokens** → **Create new API Token**
3. Set:
   - Name: `Import Script`
   - Type: `Full access`
   - Duration: `Unlimited`
4. **Copy the token** (shown only once!)

### Step 3: Update VPS Environment
```bash
# SSH into VPS
ssh your-user@your-vps

# Edit .env file
cd ~/perfume-backend
nano .env

# Add/update this line:
API_TOKEN=paste-your-token-here

# Save and restart
docker-compose restart
```

### Step 4: Run Import
```bash
# Option A: Using the helper script
chmod +x run-import.sh
./run-import.sh

# Option B: Direct command
docker-compose exec backend npm run import
```

## 📊 Database Persistence

The database is preserved across deployments:
- **Location**: `.tmp/data.db`
- **Backups**: `.tmp/data.db.backup.YYYYMMDD_HHMMSS`
- **Volume Mount**: Defined in `docker-compose.yml`

## 🔄 Manual Import

Run import script anytime:
```bash
cd ~/perfume-backend
docker-compose exec backend npm run import
```

The script is **idempotent** - safe to run multiple times. It:
- Skips existing brands/collections/perfumes
- Only creates missing items
- Won't duplicate data

## 🐛 Troubleshooting

### Import fails with 401 errors
**Cause**: Invalid/expired API token
**Fix**: Generate new token (see Step 2-4 above)

### Database not persisting
**Cause**: Volume mount missing
**Fix**: Check `docker-compose.yml` has:
```yaml
volumes:
  - ./.tmp:/app/.tmp
```

### Import script not found
**Cause**: Old deployment
**Fix**: Push new commit to trigger redeployment

## 📝 Files Reference

- `import.js` - Main import script
- `brands.json` - Brand data
- `collections.json` - Collection data
- `perfumes.json` - Perfume data
- `.env` - Environment variables (API token here)
- `IMPORT_SETUP.md` - Detailed import setup guide
