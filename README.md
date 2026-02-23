# Registry UI Project

A full-stack application for managing and viewing Docker Registry content. This project consists of a React frontend and an Express backend, orchestrated with Docker Compose.

## ✨ Features

-   **📊 Dashboard**: comprehensive overview of all repositories with search and filtering capabilities.
-   **📦 Repository Browser**: Deep dive into repositories to view tags, manifest details, and pull commands.
-   **🏷️ Tag Management**: Inspect image tags, view layers, image history, and detailed metadata.
-   **👥 User Management**: Admin interface for managing users and roles (Admin/User).
-   **🕒 Recent Activities**: Track real-time push and pull events across the registry.
-   **🔐 Secure Authentication**: Integrated JWT-based authentication system.
-   **🌓 Dark/Light Mode**: Fully responsive UI with theme support for comfortable viewing.
-   **🛡️ Vulnerability Scanning (CVE)**: Integrated Aquasec Trivy scanner running in dedicated server mode with persistent vulnerability database caching.
-   **🗑️ Repository & Tag Deletion**: Securely hard-delete entire repositories or specific image tags directly from the registry's storage.
-   **🪝 Webhooks & Tracking**: Real-time listeners for Docker push/pull events stored cleanly in PostgreSQL.
-   **🐳 Docker Native**: Seamless integration with standard Docker Registry v2.

## 🗺️ Roadmap & Missing Features

Here are the key enterprise-ready features planned for future development:

- [ ] **🗑️ Garbage Collection Scheduler**: UI button or scheduled job to free disk space from deleted images.
- [ ] **⏳ Retention Policies**: Automated cleanup rules (e.g., "Keep last 5 tags").
- [ ] **👥 User Groups & Project Isolation**: Group-based access control (RBAC).
- [ ] **📊 Advanced Analytics**: Storage usage over time, bandwidth stats, etc.
- [ ] **📦 Helm Chart Support**: Dedicated UI for Helm charts stored in the registry.

## 🚀 Quick Start (Docker)

The easiest way to get the entire stack running is using Docker Compose.

1.  **Prerequisites**: Ensure you have Docker and Docker Compose installed.
2.  **Start the application**:
    ```bash
    docker-compose up --build
    ```
3.  **Access the application**:
    - Frontend: [http://localhost:5173](http://localhost:5173)
    - Backend API: [http://localhost:6500](http://localhost:6500)
    - Registry: [http://localhost:5432](http://localhost:5432)

## 🛠️ Local Development

If you want to run the services individually for development:

### Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Environment Variables:
    Create a `.env` file in the `backend` directory (or use defaults).
    ```env
    PORT=6500
    HOST=localhost
    DB_HOST=localhost # Or your postgres host
    DB_PORT=5432
    DB_USER=postgres
    DB_PASS=password
    DB_NAME=registry
    JWT_SECRET=your_secret_key
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at [http://localhost:5173](http://localhost:5173).

## 🏗️ Project Structure

- **frontend/**: React application using Vite, TailwindCSS, and TypeScript.
- **backend/**: Express.js application handling API requests, authentication, and registry interaction.
- **docker-compose.yaml**: Orchestration for Frontend, Backend, Postgres Database, and Docker Registry.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default (Docker) |
| :--- | :--- | :--- |
| `POSTGRES_USER` | Database user | `registry` |
| `POSTGRES_PASSWORD` | Database password | `registry123` |
| `POSTGRES_DB` | Database name | `registry` |
| `PORT` | Backend port | `6500` |
| `JWT_SECRET` | Secret for JWT auth | `supersecret` |

## 📦 Services

- **Registry**: The official Docker Registry v2 image.
- **Trivy Server**: Dedicated Aquasec Trivy server for offline, instant container vulnerability scanning.
- **Postgres**: Database for storing user data and metadata.
- **Backend**: Node.js service connecting the frontend to the registry and database.
- **Frontend**: Modern UI to browse repositories, tags, and manage users.

## ⚠️ Troubleshooting

- **Database Connection**: If running locally, ensure your local Postgres instance is running and matches the credentials in `.env`.
- **Registry Auth**: The backend handles authentication with the registry using a token service. Ensure certificates are generated if running in production mode (dev mode uses simplified auth).
