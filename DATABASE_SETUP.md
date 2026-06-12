# Docker & Database Configuration Guide
docker compose up backend postgres

## Overview

The NaijaMed backend is now configured to work with:
- **SQLite** - Local development (no Docker)
- **Local PostgreSQL** - Docker development (auto-creates database from models)
- **Render PostgreSQL** - Production (external managed database)

## Quick Start

### Run Everything with Docker (Recommended for Testing)

```bash
cd frontend
docker-compose down -v
docker-compose up --build
```

This will:
1. ✅ Start PostgreSQL container (builds tables from your models)
2. ✅ Start Backend (connects to PostgreSQL)
3. ✅ Start Frontend (connects to Backend)
4. ✅ All running on localhost

**Access:**
- Frontend: `http://localhost:8000`
- Backend: `http://localhost:3005`
- PostgreSQL: `localhost:5432` (credentials in docker-compose.yml)

---

## Configuration Options

### Option 1: Docker with Local PostgreSQL (Current Setup)

**Use case:** Testing entire stack locally

```bash
# In docker-compose.yml, backend environment is set to:
DATABASE_URL=postgresql://naijamed_user:naijamed_password@postgres:5432/naijamed_db
```

**Database tables** are automatically created from your Sequelize models via `sequelize.sync({ alter: true })`

```bash
# Run
docker-compose up --build
```

**Pros:**
- No external dependencies
- Full local testing
- Data persists in Docker volumes

**Cons:**
- Docker required
- More resource usage

---

### Option 2: Development with SQLite (No Docker)

**Use case:** Quick local development without Docker

```bash
# 1. Terminal 1 - Backend
cd backend
npm install
npm run dev

# 2. Terminal 2 - Frontend
cd frontend
python -m http.server 8000

# Backend will use SQLite (config/db.js detects no DATABASE_URL)
```

**Database:** `backend/naijamed.db` (created automatically)

**Pros:**
- Simplest setup
- No Docker needed
- Fast startup

**Cons:**
- SQLite only (not production-like)
- Can't scale

---

### Option 3: Production with Render PostgreSQL

**Use case:** Production deployment

**Current .env is already configured:**
```bash
DATABASE_URL=postgres-url
```

**To deploy:**

```bash
# 1. Push code to Git
git add .
git commit -m "Update to PostgreSQL"
git push

# 2. Deploy to Render/Railway/Heroku with DATABASE_URL env var set

# 3. Migrations run automatically on startup
```

**Pros:**
- Production-ready
- Managed database
- Automatic backups

**Cons:**
- External service required
- Monthly cost

---

## How Database Selection Works

The backend automatically chooses the database based on environment:

```javascript
// config/db.js logic:

if (NODE_ENV === 'production' || NODE_ENV === 'staging' || DATABASE_URL) {
  // Use PostgreSQL
  console.log("Using PostgreSQL");
} else {
  // Use SQLite
  console.log("Using SQLite");
}
```

### Decision Tree:
```
1. Is DATABASE_URL set in .env? → Use PostgreSQL
2. Is NODE_ENV = production? → Use PostgreSQL  
3. Is NODE_ENV = staging? → Use PostgreSQL
4. Otherwise → Use SQLite
```

---

## Switching Databases

### From SQLite → PostgreSQL in Docker

```bash
# 1. Verify .env has DATABASE_URL for local postgres:
DATABASE_URL=postgresql://pg_url

# 2. Rebuild and restart
docker-compose down -v
docker-compose up --build

# ✅ Backend will automatically create all tables from models
```

### From Docker PostgreSQL → Render PostgreSQL

```bash
# 1. Update .env:
DATABASE_URL=postgresql://pg_url

# 2. Restart backend
docker-compose down
docker-compose up --build

# 3. Backend will sync models to Render database
```

### From PostgreSQL → SQLite

```bash
# 1. Comment out or remove DATABASE_URL from .env:
# DATABASE_URL=...

# 2. Run without Docker:
cd backend
npm run dev

# ✅ Will automatically use SQLite
```

---

## Database Schema Management

### Automatic Schema Sync

Your backend uses `sequelize.sync({ alter: true })` which:
- ✅ Creates tables if they don't exist
- ✅ Alters tables if schema changes
- ✅ Preserves existing data
- ⚠️ Warning: Don't use `alter: true` in production with critical data

**In server.js:**
```javascript
await sequelize.sync({ alter: true });
```

### Models Used

All tables are created from your models in `/backend/models/`:
- User
- Patients
- Doctors
- Conversation
- Message
- Case
- Prescription
- Emergency
- Notification
- AuditLog

---

## Troubleshooting

### Docker: "Connection refused" to PostgreSQL

```bash
# PostgreSQL container didn't start
docker-compose logs postgres

# Solution: Clear volumes and restart
docker-compose down -v
docker-compose up --build
```

### Backend: "Can't find module pg"

```bash
# PostgreSQL driver not installed
cd backend
npm install pg

# Rebuild Docker
docker-compose down
docker-compose up --build
```

### Docker: "Port 5432 already in use"

```bash
# Another PostgreSQL is running
lsof -i :5432

# Kill it or change port in docker-compose.yml:
ports:
  - "5433:5432"  # Use 5433 instead
```

### Data not persisting in Docker

```bash
# Verify volume is configured in docker-compose.yml:
volumes:
  postgres_data:

# And backend service references it:
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

## Accessing the Database

### PostgreSQL in Docker

```bash
# From host machine
psql -h localhost -U naijamed_user -d naijamed_db

# Password: naijamed_password

# Or use GUI tools:
# - DBeaver
# - pgAdmin
# - VS Code PostgreSQL extension
```

### SQLite Locally

```bash
# Install sqlite3
sudo apt-get install sqlite3  # Linux
brew install sqlite3          # Mac

# Access database
sqlite3 backend/naijamed.db

# View tables
.tables

# Check schema
.schema User
```

---

## Environment Variables Reference

```bash
PORT=3005                           # Backend port
NODE_ENV=development                # development|staging|production
DATABASE_URL=...                    # PostgreSQL connection string (optional)
JWT_SECRET=your-secret-key         # JWT signing secret
JWT_EXPIRATION=1h                  # Token expiration time
EMAIL_HOST=smtp.gmail.com          # Email service
FRONTEND_URL=http://localhost:8000 # Frontend base URL
GROQ_API_KEY=...                   # AI service API key
```

---

## Performance Tips

1. **Local Development**: Use SQLite (fastest startup)
2. **Team Testing**: Use Docker PostgreSQL (realistic DB)
3. **Staging**: Use Render PostgreSQL (production-like)
4. **Production**: Use Render PostgreSQL (managed, backed up)

---

## File Structure

```
backend/
├── .env                      # Current configuration (has DATABASE_URL)
├── .env.example              # Template with all options
├── config/
│   └── db.js                # Database connection logic
├── models/
│   ├── models.js            # All model exports
│   ├── userModel.js         # User table definition
│   ├── caseModel.js         # Case table definition
│   └── ... (other models)
└── server.js                # App startup with sequelize.sync()
```

---

## Next Steps

1. **Test Local Setup**
   ```bash
   docker-compose up --build
   # Verify all containers start
   ```

2. **Test Data**
   - Create account at `http://localhost:8000`
   - Send chat message
   - Verify data in PostgreSQL

3. **Switch Databases**
   - Update DATABASE_URL in .env
   - Restart backend
   - Verify connectivity

4. **Deploy to Production**
   - Set DATABASE_URL on hosting platform
   - Deploy code
   - Monitor logs

---

## Support

For issues:
1. Check `config/db.js` to verify database selection logic
2. Check backend logs: `docker-compose logs backend`
3. Check PostgreSQL logs: `docker-compose logs postgres`
4. Verify `.env` has correct DATABASE_URL
5. Try clearing volumes: `docker-compose down -v`

Good luck! 🚀
