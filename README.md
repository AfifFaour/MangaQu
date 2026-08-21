# MangaQu 📖

A full-stack manga reading platform built around a React frontend and a Node.js/Express backend. MangaQu provides manga discovery, chapter reading, user accounts, reading history, favourites, and administration tools through a responsive web interface.

## ✨ Features

- **Manga discovery** — browse titles by newest, updated, type, and genre.
- **Chapter reading** — dedicated manga and chapter reader flows, including volume reading routes.
- **Accounts & authentication** — login, registration, protected routes, profiles, favourites, and reading history.
- **Admin tools** — user management and manga management behind admin-only routes.
- **Responsive UI** — React components with Material UI and Lucide icons.
- **Relational backend** — Express APIs backed by MySQL/Sequelize.
- **Media and platform services** — the backend includes support for Cloudinary, Redis, email delivery, validation, rate limiting, and scheduled jobs.

## 🧱 Architecture

```text
MangaQu/
├── client/                 # React application
│   ├── public/
│   └── src/
│       ├── Components/     # Reusable UI and reader components
│       ├── context/        # Authentication and manga state
│       ├── hooks/          # Shared React hooks
│       ├── pages/          # Application routes/screens
│       ├── services/       # API/service layer
│       ├── styles/
│       └── utils/
└── server/                 # Node.js / Express application
    ├── Assets/
    ├── Config/
    ├── db.js
    ├── server.js
    └── package.json
```

The frontend uses React Router for navigation and wraps the application with authentication and manga state providers. Protected and admin-only routes are enforced at the routing layer.

## 🛠️ Tech Stack

### Frontend

- React 19
- React Router DOM 7
- Material UI 7
- Lucide React
- Axios
- JavaScript / CSS

### Backend

- Node.js
- Express 4
- Sequelize
- MySQL / MySQL2
- JWT and session-based authentication dependencies
- bcryptjs
- Cloudinary
- Redis
- Nodemailer
- Joi / Express Validator
- Helmet / CORS / rate limiting
- Jest / Supertest / Nodemon for development and testing

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm
- MySQL
- Any external services required by your local configuration (for example Cloudinary, Redis, or email delivery)

### 1. Clone the repository

```bash
git clone https://github.com/AfifFaour/MangaQu.git
cd MangaQu
```

### 2. Install the client

```bash
cd client
npm install
npm start
```

The client is configured to proxy API requests to the deployed backend endpoint defined in `client/package.json`. For local development, point the client at your own backend as appropriate.

### 3. Install and run the server

```bash
cd ../server
npm install
npm run dev
```

Other server scripts include:

```bash
npm start
npm run migrate
npm run seed
```

### 4. Configure environment variables

Create local `.env` files for the secrets and service configuration required by the backend and frontend. Do **not** commit real credentials, API keys, database passwords, or private tokens to Git.

## 📜 Available Routes

The current frontend includes public routes for home, browsing, newest/updated manga, genres, types, manga details, reading, authentication, and informational pages. Authenticated routes include profile, favourites, history, and dashboard functionality; admin routes cover user and manga management.

## 🔐 Security Notes

MangaQu contains environment files in the repository history. Before deploying or sharing the project further, rotate any credentials that may have been committed and keep production secrets outside Git.

## 📌 Project Status

MangaQu is an active full-stack application project with a substantial client/server codebase. The repository contains both application code and dependency lockfiles for reproducible installs.

## 👤 Author

**Afif Faour**

- GitHub: https://github.com/AfifFaour
