# Teachers Copilot - Setup and Running Guide

This guide provides comprehensive instructions for setting up and running the Teachers Copilot project, which consists of three main components:  AI Agent, Backend, and Frontend.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
   - [1. AI Agent Setup](#1-ai-agent-setup)
   - [2. Backend Setup](#2-backend-setup)
   - [3. Frontend Setup](#3-frontend-setup)
4. [Running the Application](#running-the-application)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Python 3.11** or higher
- **Node.js** (v16 or higher) and **npm**
- **uv** (Python package installer) - [Install uv](https://github.com/astral-sh/uv)
- **Git** (for cloning the repository)

### Required API Keys

You'll need the following API keys:

- **LANGSMITH_API_KEY** - For LangSmith tracking
- **GROQ_API_KEY** - For GROQ AI model access
- **MONGO_URI** - MongoDB connection string
- **JWT_SECRET** - Secret key for JWT authentication
- **SMTP credentials** - For email functionality
- **Google Cloud Service Account** - For PPT Generator agent (optional)

---

## Project Structure

```
teachers-copilot/
├── ai-agent/              # AI Agent with LangGraph
│   └── agents/
│       ├── analyze_syllabus/
│       └── ppt_generator/
├── backend/               # Node.js/Express backend
└── frontend/              # React/Next.js frontend
```

---

## Setup Instructions

### 1. AI Agent Setup

The AI Agent uses LangGraph and deep agents to process educational content. 

#### Step 1.1: Navigate to AI Agent Directory

```bash
cd ai-agent
```

#### Step 1.2: Create Environment File

Create a `.env` file in the `ai-agent` directory:

```bash
touch .env
```

Add the following environment variables:

```env
LANGSMITH_API_KEY=your_langsmith_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

#### Step 1.3: Create and Activate Virtual Environment

```bash
# Create virtual environment with Python 3.11
uv venv --python 3.11

# Sync dependencies
uv sync

# Activate virtual environment
# On Windows:
. venv\Scripts\activate

# On macOS/Linux: 
source .venv/bin/activate
```

#### Step 1.4: Setup Individual Agents

You'll need to set up each agent individually. Navigate to the specific agent directory and install dependencies. 

**For Analyze Syllabus Agent:**

```bash
cd agents/analyze_syllabus
uv pip install -r requirements.txt
```

**For PPT Generator Agent (Optional):**

```bash
cd agents/ppt_generator
uv pip install -r requirements.txt
```

##### Google Cloud Configuration (PPT Generator Only)

If you're using the PPT Generator agent: 

1. Create a Google Cloud project
2. Enable the required APIs (Google Slides API, Google Drive API)
3. Create a service account
4. Download the credentials JSON file
5. Place the credentials file in the `agents/ppt_generator/` directory
6. Update the credentials path in your configuration

#### Step 1.5: Run the AI Agent

From the agent directory (e.g., `agents/analyze_syllabus`):

```bash
langgraph dev
```

The agent will start and be accessible at the default LangGraph development server port. 

---

### 2. Backend Setup

The backend is built with Node.js and handles API requests, authentication, and database operations.

#### Step 2.1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2.2: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
touch .env
```

Add the following environment variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/teachers-copilot

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password_or_app_password
SMTP_FROM=your_email@gmail.com

# AI Agent Configuration
AIAGENT_BASE_URL=http://localhost:8123
ANALYZER_ASSISTANT_ID=your_assistant_id_here
```

**Note:** 
- Replace `MONGO_URI` with your MongoDB connection string
- For Gmail SMTP, use an [App Password](https://support.google.com/accounts/answer/185833)
- Update `AIAGENT_BASE_URL` with your AI agent's URL (default LangGraph dev server is port 8123)

#### Step 2.3: Install Dependencies

```bash
npm install
```

#### Step 2.4: Run the Backend

**Development mode with hot reload:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The backend will start on the default port (usually `http://localhost:3000` or as specified in your configuration).

---

### 3. Frontend Setup

The frontend is built with React/Next.js and provides the user interface. 

#### Step 3.1: Navigate to Frontend Directory

```bash
cd frontend
```

#### Step 3.2: Install Dependencies

```bash
npm install
```

#### Step 3.3: Configure Environment (Optional)

If your frontend requires environment variables, create a `.env.local` file:

```bash
touch .env.local
```

Add any required variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Step 3.4: Run the Frontend

**Development mode:**

```bash
npm run dev
```

**Production build:**

```bash
npm run build
npm start
```

The frontend will start on the default port (usually `http://localhost:3001` or as specified in Next.js configuration).

---

## Running the Application

To run the complete application, you need to start all three components in separate terminal windows:

### Terminal 1: AI Agent

```bash
cd ai-agent/agents/analyze_syllabus
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
langgraph dev
```

### Terminal 2: Backend

```bash
cd backend
npm run dev
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev
```

### Access the Application

Once all services are running: 

- **Frontend:** `http://localhost:3000` (or configured port)
- **Backend API:** `http://localhost:3000/api` (or configured port)
- **AI Agent (LangGraph):** `http://localhost:8123` (default LangGraph port)

---

## Troubleshooting

### Common Issues

#### 1. Virtual Environment Activation Issues

**Windows PowerShell:**
If you encounter execution policy errors: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Alternative activation:**
```bash
python . venv/Scripts/activate. bat  # Windows CMD
```

#### 2. Port Already in Use

If a port is already in use, you can:
- Stop the process using the port
- Or change the port in your configuration files

**Find process using port (Linux/macOS):**
```bash
lsof -i :3000
```

**Find process using port (Windows):**
```cmd
netstat -ano | findstr :3000
```

#### 3. MongoDB Connection Issues

- Ensure MongoDB is running:  `mongod` or check your MongoDB Atlas connection
- Verify the `MONGO_URI` in your `.env` file
- Check firewall settings if using MongoDB Atlas

#### 4. AI Agent Not Responding

- Verify all environment variables in `ai-agent/.env`
- Check that the virtual environment is activated
- Ensure all dependencies are installed:  `uv pip install -r requirements.txt`
- Check LangGraph logs for errors

#### 5. SMTP Email Issues

- For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833) instead of your regular password
- Ensure "Less secure app access" is enabled (if applicable)
- Verify SMTP settings match your email provider

#### 6. Google Cloud Credentials (PPT Generator)

- Ensure the credentials JSON file is in the correct directory
- Verify the service account has the necessary permissions
- Check that the required APIs are enabled in Google Cloud Console

---

## Additional Notes

### Development vs Production

- **Development:** Use `npm run dev` and `langgraph dev` for hot reloading
- **Production:** Build optimized versions with `npm run build` and use production-ready configurations

### Environment Variables Security

- Never commit `.env` files to version control
- Use `.env.example` files to document required variables
- For production, use secure environment variable management (e.g., Docker secrets, AWS Secrets Manager)

### Updating Dependencies

**AI Agent:**
```bash
cd ai-agent
uv sync --upgrade
```

**Backend/Frontend:**
```bash
npm update
```

---

## Quick Start Commands

For a rapid start, use these commands in order:

```bash
# Clone and setup
git clone <repository-url>
cd teachers-copilot

# Terminal 1 - AI Agent
cd ai-agent && uv venv --python 3.11 && uv sync && .venv\Scripts\activate
cd agents && uv pip install -r requirements.txt && langgraph dev

# Terminal 2 - Backend
cd backend && npm install && npm run dev

# Terminal 3 - Frontend
cd frontend && npm install && npm run dev
```

---

## Support

For issues or questions: 
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs for error messages
3. Open an issue on the GitHub repository
4. Contact the development team

---

**Last Updated:** 2025-12-18