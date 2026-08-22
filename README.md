# MangaQu 📚

> A full-stack manga reading platform built with **React**, **Node.js/Express**, **Sequelize**, and **MySQL**.

## 🌐 Live Demo

**[Open MangaQu Demo](https://afiffaour.github.io/MangaQu/)**

The frontend is deployed with **GitHub Pages** and connects to the MangaQu backend API hosted on Render.

> **Demo note:** Some features that require the backend, database, authentication, or external services may depend on the production API being available.

## ✨ Features

### 👤 Users
- Browse manga by newest, updated, type, and genre
- Search and view manga details
- Read manga chapters through a dedicated reader
- Register and log in
- Manage a personal profile
- Add manga to favourites
- Track reading history and continue reading
- Responsive interface

### 🛠️ Administration
- Protected administrator routes
- User management
- Manga management
- Chapter/content management

## 🧱 Architecture

```text
MangaQu/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── Components/     # Reusable UI and reader components
│       ├── context/        # Shared application state
│       ├── hooks/          # Reusable React hooks
│       ├── pages/          # Application screens/routes
│       ├── services/       # API/service layer
│       ├── styles/
│       └── utils/
│
└── server/                 # Node.js / Express backend
    ├── Assets/
    ├── Config/
    ├── db.js
    ├── server.js
    └── package.json
```

### Request flow

```text
React Client
     │
     │ HTTP / REST API
     ▼
Node.js + Express
     │
     ├── Authentication / authorization
     ├── Validation / middleware
     ├── Application logic
     │
     ▼
Sequelize ORM
     │
     ▼
MySQL Database
```

The React application uses React Router for navigation and a dedicated service layer for communication with the backend API.

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
- JWT/session authentication dependencies
- bcryptjs
- Joi / Express Validator
- Helmet
- CORS
- Rate limiting

### Supporting Services
- Cloudinary
- Redis
- Nodemailer

### Testing / Development
- Jest
- Supertest
- Nodemon

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm
- MySQL
- Any external services required by your local configuration, such as Cloudinary, Redis, or email delivery

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

### 3. Install and run the server

Open another terminal:

```bash
cd server
npm install
npm run dev
```

The server also provides the following project scripts where configured:

```bash
npm start
npm run migrate
npm run seed
```

### 4. Environment configuration

Create the required local `.env` files using the variable names expected by the current application configuration.

**Never commit real passwords, API keys, database credentials, JWT secrets, or other private values to GitHub.**

### 5. Database

Create the MySQL database required by the server and configure the connection using your local credentials. Run the project's migration/seed scripts when required by the current database setup.

## 📜 Application Routes

The application includes routes for:

- Home and manga discovery
- Newest / updated manga
- Genres and types
- Manga details
- Chapter reading
- Authentication
- User profile
- Favourites
- Reading history
- Dashboard functionality
- Administration and user/manga management

## 🔐 Security

The backend includes authentication/authorization dependencies and common security middleware such as password hashing, request validation, security headers, CORS configuration, and rate limiting.

Before deployment, verify that:

1. Production secrets are stored outside the repository.
2. `.env` files containing secrets are ignored by Git.
3. Any credentials previously committed to Git history have been rotated.
4. Database accounts use appropriate permissions.
5. CORS and other security settings are configured for the production environment.

## 🖼️ Screenshots

Recommended screenshots for the portfolio README:

- Home / discovery page
- Manga details page
- Chapter reader
- Login / registration
- User library
- Admin dashboard

## 🎓 Project Context

MangaQu was developed as a university senior project to demonstrate full-stack web development, REST API integration, relational database design, authentication, responsive UI development, and software engineering practices.

## 👤 Author

**Afif Faour**

- GitHub: https://github.com/AfifFaour

## 📄 License

This project is intended primarily for educational and portfolio purposes.
