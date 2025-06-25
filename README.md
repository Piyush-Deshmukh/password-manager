# Password Manager Extension

A secure password manager Chrome extension with encrypted storage and auto-fill capabilities.

## 🔧 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (MongoDB Atlas account)
- **Google Chrome** browser
- **npm** package manager

## 🚀 Installation & Setup

### 1. Clone/Download the Project

```bash
git clone https://github.com/Piyush-Deshmukh/password-manager.git
cd password-manager
```

### 2. Backend Setup

#### Step 1: Navigate to Backend Directory
```bash
cd backend
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Environment Variables Setup
Create a `.env` file in the backend directory:

```env
# MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/password-manager

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server Port
PORT=5000
```

**Important:** Replace `your-super-secret-jwt-key-here-make-it-long-and-random` with a strong, random secret key.

#### Step 4: Setup MongoDB Atlas

### 3. Chrome Extension Setup

#### Step 1: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select your `extension/` directory
5. The extension should now appear in your extensions list

## 🏃‍♂️ Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
DB connection successful.
```

**Note:** The project uses nodemon for auto-restart during development. For production, use `node server.js`

### 2. Test the Extension

1. Click the extension icon in Chrome toolbar
2. Register a new account or login
3. Navigate to any website with login forms
4. Use the extension to save and auto-fill passwords

## 📋 Available Scripts

The backend includes the following npm scripts:

```bash
# Development mode with auto-restart
npm run dev

# Production mode
node server.js
```

## 📜 License

This project is for educational purposes. Please ensure compliance with relevant security and privacy regulations when deploying.

---

**⚠️ Security Warning:** This is a development setup. For production use, implement additional security measures including HTTPS, rate limiting, input validation, and proper error handling.