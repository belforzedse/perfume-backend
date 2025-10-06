# Import Script Setup

The import script requires a valid Strapi API token. Follow these steps after deployment:

## 1. Generate API Token

1. Access your Strapi admin panel: `https://kioskapi.gandom-perfume.ir/admin`
2. Login with admin credentials
3. Go to **Settings** → **API Tokens** → **Create new API Token**
4. Configure:
   - **Name**: Import Script
   - **Token type**: Full access
   - **Duration**: Unlimited
5. Copy the generated token

## 2. Update Environment Variables

Update the `.env` file on your VPS:

```bash
ssh your-vps-user@your-vps-host
cd ~/perfume-backend
nano .env
```

Update the `API_TOKEN` line:
```env
API_TOKEN=your-new-token-here
```

## 3. Run Import Script

```bash
# Inside the container
docker-compose exec backend npm run import

# Or from host
cd ~/perfume-backend
docker-compose exec backend npm run import
```

## Troubleshooting

**401 Unauthorized Error**:
- Token is invalid/expired → Generate new token (Step 1)
- Token not in .env → Add to .env file (Step 2)
- Container not restarted → Run `docker-compose restart`

**Brand/Collection Already Exists**:
- This is normal - the script skips duplicates
- Safe to re-run multiple times
