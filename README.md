# FootLink

A web platform for football players, agents, and clubs — combining player profiles, secure document management with electronic signatures, and structured communication. Built on a scalable, API-first architecture.

## Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** PostgreSQL + SQLAlchemy ORM
- **Migrations:** Alembic
- **Auth:** JWT (python-jose) + bcrypt password hashing
- **Validation:** Pydantic v2

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios

## Project Structure

```
FootLink/
├── app/
│   ├── main.py                     # App entrypoint, middleware, exception handlers
│   ├── core/
│   │   ├── config.py               # Environment-based settings
│   │   ├── database.py             # SQLAlchemy engine & session
│   │   ├── security.py             # JWT creation, password hashing
│   │   ├── exceptions.py           # Global exception handlers
│   │   └── logging_config.py       # Structured logging setup
│   ├── models/
│   │   ├── base.py                 # Abstract base (id, created_at, updated_at)
│   │   ├── user.py                 # User + UserRole enum
│   │   ├── profile.py              # Profile + agent_players join table
│   │   ├── document.py             # Document + signatures + shares
│   │   ├── message.py              # Direct messages
│   │   └── application.py          # Player-to-club applications
│   ├── schemas/                    # Pydantic request/response models
│   ├── services/                   # Business logic layer
│   ├── api/v1/endpoints/
│   │   ├── auth.py                 # Signup, login
│   │   ├── users.py                # Current user operations
│   │   ├── profile.py              # Profile CRUD
│   │   ├── documents.py            # Upload, share, sign, view
│   │   ├── messages.py             # Send, conversations, contacts
│   │   ├── agents.py               # Agent-player roster management
│   │   ├── players.py              # Player database search
│   │   └── applications.py         # Player-to-club application workflow
│   └── utils/dependencies.py       # Auth & RBAC dependencies
├── alembic/                        # Database migrations
├── uploads/                        # Local file storage
├── requirements.txt
├── alembic.ini
├── .env
│
└── footlink-frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Root layout
    │   │   ├── page.tsx             # Redirect to /login
    │   │   ├── login/page.tsx       # Login form
    │   │   ├── signup/page.tsx      # Signup form
    │   │   └── (authenticated)/
    │   │       ├── layout.tsx       # Auth guard + navbar wrapper
    │   │       ├── dashboard/       # Dashboard with role-based quick links
    │   │       ├── profile/         # Profile create/edit
    │   │       ├── documents/       # Upload, share, sign, view documents
    │   │       ├── messages/        # Chat with contact list & search
    │   │       ├── players/         # Player database search (CLUB/AGENT)
    │   │       ├── agents/          # Managed players roster (AGENT)
    │   │       └── applications/    # Apply to clubs / review applications
    │   ├── components/
    │   │   ├── Navbar.tsx           # Role-based navigation
    │   │   └── AuthGuard.tsx        # Client-side route protection
    │   └── lib/
    │       ├── api.ts               # Axios instance with JWT interceptors
    │       └── constants.ts         # Nav items config
    ├── .env.local
    ├── package.json
    └── tailwind.config.ts
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### Backend

```bash
cd FootLink

# Create database
psql -U postgres -c "CREATE DATABASE \"footlink-db\";"

# Install dependencies
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment — create .env:
# DATABASE_URL=postgresql://<user>:<password>@localhost:5432/footlink-db
# SECRET_KEY=<your-secret-key>
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30
# BACKEND_CORS_ORIGINS=["http://localhost:3000"]
# UPLOAD_DIR=uploads
# ENVIRONMENT=development

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

API docs: **http://localhost:8000/docs**

### Frontend

```bash
cd FootLink/footlink-frontend

npm install

# .env.local should contain:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

npm run dev
```

App: **http://localhost:3000**

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/signup` | Register (PLAYER / AGENT / CLUB) |
| POST | `/api/v1/auth/login` | Login, returns JWT token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Get current user |
| PUT | `/api/v1/users/me` | Update current user |

### Profile
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/profile/me` | Get own profile |
| POST | `/api/v1/profile/me` | Create profile |
| PUT | `/api/v1/profile/update` | Update profile |
| GET | `/api/v1/profile/{id}` | View any profile |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/documents/upload` | Upload document (multipart) |
| GET | `/api/v1/documents/` | List own documents |
| GET | `/api/v1/documents/shared` | List documents shared with you |
| GET | `/api/v1/documents/{id}/view` | View/download document file |
| POST | `/api/v1/documents/{id}/share` | Share with another user |
| POST | `/api/v1/documents/{id}/sign` | E-sign (shared users only) |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/messages/send` | Send message to a user |
| GET | `/api/v1/messages/{user_id}` | Get conversation thread |
| GET | `/api/v1/messages/contacts/list` | List users you've chatted with |
| GET | `/api/v1/messages/contacts/search` | Search users by email |

### Agents (AGENT role)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/agents/players` | List managed players |
| POST | `/api/v1/agents/players/{player_id}` | Add player to roster |
| DELETE | `/api/v1/agents/players/{player_id}` | Remove player from roster |

### Players (CLUB/AGENT roles)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/players/` | Search player profiles (name, position, age) |

### Applications
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/applications/` | Player applies to a club |
| GET | `/api/v1/applications/` | List applications (role-aware) |
| PUT | `/api/v1/applications/{id}` | Club accepts/rejects application |

## User Roles

| Role | Capabilities |
|------|-------------|
| **PLAYER** | Create profile, upload/share/sign documents, message, apply to clubs |
| **AGENT** | All of the above + search player database, manage player roster |
| **CLUB** | All of player + search player database, review applications |

## Error Response Format

All errors return a consistent structure:

```json
{
  "success": false,
  "message": "Description of what went wrong",
  "errors": [{"field": "body.email", "message": "Invalid email"}]
}
```
