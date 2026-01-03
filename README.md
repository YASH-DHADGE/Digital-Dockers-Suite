# Digital Dockers Suite - AI-Powered Workplace Platform

> **Your Complete Digital Workspace** - A comprehensive AI-powered productivity platform combining document management, team communication, task tracking, and intelligent insights.

## 🌟 Overview

Digital Dockers Suite is a modern MERN-stack application designed to streamline workplace productivity. The platform integrates multiple productivity tools into one cohesive workspace:

- **Document Management** - Upload, analyze, and extract insights from documents
- **AI Chat Assistant** - OpenAI and Ollama-powered conversational AI
- **Task Management** - Organize and track tasks with deadlines
- **Team Communication** - Real-time messaging and group chats
- **Calendar Integration** - Google Calendar sync for meetings
- **Email Management** - Integrated email workflows
- **Meeting Scheduler** - Plan and organize meetings
- **AI Insights** - Data-driven analytics and recommendations
- **Reports Generation** - Automated reporting tools

## 📁 Project Structure

```
Digital-Dockers-Suite/
├── backend/                   # Node.js/Express backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Request handlers
│   ├── middlewares/           # Express middlewares
│   ├── models/                # Mongoose schemas
│   │   ├── Calendar.js        # Calendar events model
│   │   ├── Chat.js            # Chat messages model
│   │   ├── Communication.js   # Communication logs
│   │   ├── Document.js        # Document metadata
│   │   ├── DocumentAnalysis.js # AI analysis results
│   │   ├── Email.js           # Email management
│   │   ├── Insight.js         # Analytics insights
│   │   ├── Meeting.js         # Meeting schedules
│   │   ├── Message.js         # Messages model
│   │   ├── Report.js          # Generated reports
│   │   ├── Task.js            # Task management
│   │   └── User.js            # User authentication
│   ├── routes/                # API routes
│   ├── scripts/               # Utility scripts
│   ├── services/              # Business logic layer
│   ├── uploads/               # File upload storage
│   ├── .env                   # Environment variables
│   ├── package.json           # Dependencies
│   └── server.js              # Express server entry
├── frontend/                  # React frontend
│   ├── src/                   # Source files
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── node_modules/              # Dependencies
└── README.md                  # This file
```

## 🚀 Features

### 1. Document Management
- Upload documents (PDF, DOCX, TXT)
- AI-powered document analysis
- Extract text and insights using Mammoth and pdf-parse
- Categorize and organize documents
- GridFS storage for large files

### 2. AI Chat Assistant
- **OpenAI Integration** - GPT-powered responses
- **Ollama Support** - Local AI model deployment
- **LangChain** - Advanced AI workflows
- Context-aware conversations
- Multi-user chat rooms
- Direct messaging

### 3. Task Management
- Create and assign tasks
- Set deadlines and priorities
- Track progress and completion
- Task categorization
- Team collaboration

### 4. Team Communication
- Real-time messaging with Socket.IO
- Group chats and channels
- Direct messaging
- Message history
- File sharing

### 5. Calendar Integration
- Google Calendar API sync
- Create and manage events
- Meeting scheduling
- Reminders and notifications
- Calendar sharing

### 6. Email Management
- Nodemailer integration
- Send and receive emails
- Email templates
- Automated notifications

### 7. Meeting Scheduler
- Schedule meetings
- Participant management
- Calendar integration
- Meeting notes
- Recurring meetings

### 8. AI Insights & Analytics
- Data-driven insights
- Performance metrics
- Trend analysis
- Automated recommendations

### 9. Reports Generation
- Automated report creation
- Custom report templates
- Export capabilities
- Scheduled reports

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js (Google/Microsoft OAuth)
- **Real-time**: Socket.IO
- **File Storage**: GridFS, Multer
- **AI/ML**: 
  - OpenAI API
  - Ollama (local models)
  - LangChain
- **Security**: Helmet, bcryptjs, express-validator

### Frontend  
- **Framework**: React.js
- **State Management**: Context API / Redux
- **Styling**: CSS/SCSS
- **HTTP Client**: Axios

### Key Dependencies
- `googleapis` - Google Calendar/Drive integration
- `nodemailer` - Email functionality
- `mammoth` - DOCX parsing
- `pdf-parse` - PDF text extraction
- `dayjs` - Date/time manipulation
- `morgan` - HTTP logging
- `cors` - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or URI)
- OpenAI API Key (for AI features)
- Google/Microsoft Client IDs (for OAuth)

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/YASH-DHADGE/Digital-Dockers-Suite.git
cd Digital-Dockers-Suite
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Configure environment variables**

Create `.env` file in the `backend` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/digital-dockers

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
OLLAMA_BASE_URL=http://localhost:11434

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Google Calendar API
GOOGLE_API_KEY=your_google_api_key
```

4. **Frontend Setup**
```bash
cd ../frontend
npm install
```

5. **Run development servers**

**Backend:**
```bash
cd backend
npm run dev    # Runs with nodemon
# OR
npm start      # Production mode
```

**Frontend:**
```bash
cd frontend
npm start
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 Database Models

### User
- Authentication credentials
- Profile information
- OAuth tokens
- Roles and permissions

### Document
- File metadata (name, type, size)
- Upload date and user
- GridFS file reference
- Tags and categories

### DocumentAnalysis
- Extracted text content
- AI-generated insights
- Document summary
- Key entities and topics

### Chat
- Sender and recipient
- Message content
- Room/channel
- Timestamp
- Message type (direct/group)

### Task
- Title and description
- Assigned user
- Due date and priority
- Status (pending/in-progress/completed)
- Tags and categories

### Meeting
- Title and description
- Participants
- Date and time
- Location (physical/virtual)
- Calendar sync status

### Calendar
- Event details
- Google Calendar ID
- Attendees
- Reminders

### Email
- Sender and recipients
- Subject and body
- Attachments
- Send status

### Insight
- Analytics data
- Generated insights
- Recommendations
- Date range

### Report
- Report type
- Generated data
- Creation date
- Export format

### Message
- Communication logs
- Message threading
- Read status

## 🔗 API Endpoints (Examples)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - Logout
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/microsoft` - Microsoft OAuth

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/analyze` - AI analysis

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Chat
- `GET /api/chat/rooms` - List chat rooms
- `POST /api/chat/message` - Send message
- `GET /api/chat/messages/:roomId` - Get room messages

### Calendar
- `POST /api/calendar/events` - Create event
- `GET /api/calendar/events` - List events
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

### AI
- `POST /api/ai/chat` - AI chat completion
- `POST /api/ai/analyze` - Analyze document
- `POST /api/ai/insights` - Generate insights

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **OAuth 2.0** - Google/Microsoft login
- **Password Hashing** - bcryptjs encryption
- **Input Validation** - express-validator
- **Helmet.js** - HTTP security headers
- **CORS** - Configured cross-origin requests
- **Rate Limiting** - API rate limits
- **File Upload Validation** - File type and size checks

## 🧪 Testing

```bash
cd backend
npm test
```

## 📱 Real-time Features

**Socket.IO Events:**
- `message:send` - Send chat message
- `message:receive` - Receive message
- `user:online` - User online status
- `typing` - Typing indicator
- `notification` - System notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **YASH-DHADGE** - *Project Lead* - [GitHub](https://github.com/YASH-DHADGE)

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Google APIs for calendar integration
- MongoDB for database
- Socket.IO for real-time features
- Express.js community
- React.js community

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/YASH-DHADGE/Digital-Dockers-Suite/issues)
- Check existing documentation

---

**Made with ❤️ for modern digital workspaces**
