# SocietyApp

A full-stack residential society management application built with Bun, React, and SQLite.

## Project Structure

```
society-app/            # Project root
├── backend/            # Bun + SQLite API
│   ├── src/            # Layered backend logic (controllers, routes, services, db, middleware)
│   └── devtools/       # Development-only tools
├── frontend/           # React + Tailwind SPA
├── uploads/            # User-uploaded documents (ignored by git)
├── config/             # Environment configuration
├── docs/               # Deployment and API documentation
└── scripts/            # Deployment scripts
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or higher)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

### Development

Start the backend (with hot reloading) and serve the frontend:
```bash
bun run dev
```

### Production

1. Build the frontend:
   ```bash
   bun run build
   ```
2. Start the production server:
   ```bash
   bun run start
   ```

## Deployment

A deployment script template is provided in `scripts/deploy.sh`. 

Ensure you have Bun installed on your server, and then run:
```bash
./scripts/deploy.sh
```

## Features

- Society Admin and Super Admin roles.
- Member management with document uploads.
- WhatsApp notifications for key actions.
- Activity logging and audit trails.
- Dark mode support.
