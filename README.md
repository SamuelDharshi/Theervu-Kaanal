# Theervu-Kaanal: Grievance Redressal System

**Theervu-Kaanal** ("see the solution") is a citizen grievance portal for Tamil Nadu government departments (Water, Electricity, RTO). Every complaint is routed to the right local official, tracked through a public timeline, and escalated automatically if it stalls. Admins can ask an AI assistant about the data in plain English.

---

## The problem

- **Complaints go to the wrong desk.** Citizens don't know which office or official handles their street, so petitions bounce between departments.
- **No visibility.** After filing, the citizen has no idea whether anyone has read the complaint.
- **No accountability.** Grievances sit for weeks. Nothing escalates an overdue case, and recurring problems in the same area are never connected.
- **Officers lack planning data.** Funds and manpower needs are scattered, so heads of department can't see where resources are needed.
- **Administrators can't query the system.** Every "how many pending water cases in Adyar?" question needs a manual report.

## What Theervu-Kaanal solves

| Problem          | Feature                                                                                                                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routing          | Each grievance is **auto-assigned by department + taluk** to the jurisdiction's official, with AI priority analysis (Gemini, keyword fallback)                                                                                                                          |
| Visibility       | **Track by petition ID** from the home page, with a stage-by-stage timeline (Filed → Under Review → Investigation → Resolution) and notifications                                                                                                                    |
| Accountability   | Official actions (accept or decline, start progress, plan a timeline, reassign, resolve with proof document) are each logged. **Petitioner escalation** goes to the admin, and a **daily cron** flags overdue cases. Petitioner feedback and ratings are recorded |
| Recurring issues | **Repetitive-case detection** finds similar complaints in the same area                                                                                                                                                                                                 |
| Planning         | **Resource management** per case (funds, manpower, materials, dates), rolled up on the admin dashboard                                                                                                                                                                  |
| Admin analytics  | **Smart Query assistant**: "How many pending cases in Water?" or "What resources are needed in Egmore?" Gemini turns the question into a database query. Without a key, a rule-based analyzer does the same                                                             |
| Communication    | Petitioner ↔ official chat (Stream Chat) on each case                                                                                                                                                                                                                        |

Everything runs locally with **no cloud accounts**:

- **Without `MONGODB_URI`**, an embedded MongoDB stores data in `server/.localdb`.
- **Without Supabase**, sign-in uses the server's own JWT.
- **Without `GEMINI_API_KEY`**, priority and Smart Query use the offline rules.

---

## Run it

```bash
npm install                 # root (concurrently)
npm run install:all         # server + client dependencies
npm run dev                 # server :5001 (nodemon) + client :3000
```

Open http://localhost:3000. On the first run the server seeds demo data:

| Role                             | Login page            | Credentials                                                                              |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| Petitioner                       | `/login/petitioner` | `petitioner@example.com` / `Petitioner@123`                                          |
| Official (RTO, Egmore)           | `/login/official`   | `rto.egmore@example.com` / `Official@123`                                            |
| Official (Water, Egmore / Adyar) | `/login/official`   | `water.egmore@example.com`, `water.adyar@example.com` / `Official@123`             |
| Official (Electricity)           | `/login/official`   | `electricity.egmore@example.com`, `electricity.adyar@example.com` / `Official@123` |
| Admin                            | `/login/admin`      | `admin@example.com` / `Admin@123`, Admin ID `ADM001`                               |

Optional settings go in `server/.env` (see `server/.env.example`):

- `MONGODB_URI` for a cloud database.
- `GEMINI_API_KEY` for AI priority and Smart Query.
- `STREAM_API_KEY/SECRET` for chat.
- `JWT_SECRET`.
- `CORS_ORIGINS` for a LAN demo.

On the client, `REACT_APP_API_URL` points it at another server address.

To start again from fresh demo data, stop the server and delete `server/.localdb/`.

---

## How to show the demo

Allow about 8 minutes. Use three browser profiles (or one normal and two incognito windows): **Petitioner**, **RTO official**, **Admin**.

| #  | Who            | Action                                                                                                                                                             | What to say                                                                                    |
| -- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1  | Petitioner     | Log in → **Submit Grievance**: department *RTO*, district *Chennai*, division *Chennai Central*, taluk *Egmore*, title "Driving licence not issued" | "The citizen only says what and where. The system finds the responsible office."               |
| 2  | Petitioner     | The dashboard shows the new petition ID and its priority                                                                                                           | "Priority is analysed automatically. Urgent words like *accident* or *no water* raise it." |
| 3  | Official (RTO) | **Pending** tab → the new case → **Accept**                                                                                                          | "Routed straight to the Egmore RTO officer's queue."                                           |
| 4  | Official       | **Start Progress** / **Resource Management**: funds, manpower, dates                                                                                   | "Resource needs are captured per case for planning."                                           |
| 5  | Official       | **Update Timeline**: plan with milestones. Optionally reassign to the Adyar officer                                                                          | "The citizen sees this plan on the tracking page."                                             |
| 6  | Visitor        | Home page → **Track Grievance** with the petition ID                                                                                                        | "Public tracking with no login, like a courier tracking number."                               |
| 7  | Official       | **Resolve**: upload the resolution document and add a note                                                                                                   | "Proof of resolution is attached to the case."                                                 |
| 8  | Petitioner     | Give a rating and feedback. On another case, use **Escalate** with a reason                                                                                  | "The citizen closes the loop or escalates."                                                    |
| 9  | Admin          | **Escalated** tab (the seeded *Transformer sparking near school* is waiting) → respond or reassign                                                        | "Escalations land with the grievance cell head."                                               |
| 10 | Admin          | Dashboard charts: department stats, monthly trend, resource management                                                                                             | "State-wide view of load and resource needs."                                                  |
| 11 | Admin          | **Smart Query**: "How many pending cases in Water?", "What resources are needed in Egmore?", "List officials in RTO department"                              | "Ask the database in plain English."                                                           |

**If something fails live:**

- No internet means no Gemini. Smart Query and priority switch to the offline analyzer automatically.
- Chat needs Stream keys. If they aren't set, skip that step.

---

## Presentation guide

Use 9–10 slides.

1. **Title.** Theervu-Kaanal: transparent, accountable grievance redressal for Tamil Nadu.
2. **Problem.** Misrouted petitions, no tracking, no escalation. Use CM Cell or CPGRAMS backlog figures if you have them.
3. **Users.** Petitioner, department official, grievance-cell admin.
4. **Solution.** Lifecycle diagram: Submit → Auto-route → Accept → Plan → Resolve → Feedback, with Escalate looping back to the Admin.
5. **Architecture.** React (MUI) client → Express API (JWT; Supabase optional) → MongoDB (Mongoose; embedded fallback) → Gemini for priority and Smart Query → Stream Chat → node-cron for escalations → Multer for documents.
6. **Smart Query.** Natural language → intent and filters (LLM, or rules offline) → safe MongoDB query → formatted answer. Show one example end to end.
7. **Accountability features.** Timeline, escalation, repetitive-case detection, feedback ratings.
8. **Live demo.** Follow the flow above.
9. **Impact.** Faster resolution, a public audit trail, and data-driven resource allocation. SDG 16 (Strong Institutions) and SDG 6/7 (water and energy services).
10. **Future work.** Tamil voice filing, WhatsApp/IVR intake, GIS heat-maps of complaints, SLA dashboards per officer, and integration with the TN CM Helpline.

Likely viva questions:

- *How is a grievance routed?* The department plus the taluk, district and division chosen in the form are matched to the official for that jurisdiction (`findOfficialsForJurisdiction`).
- *How does escalation work?* The petitioner can escalate an eligible case with a reason. A daily cron job (`checkEligibleEscalations`) flags overdue cases, and the admin responds from the Escalated tab.
- *Is the Smart Query safe?* It only builds queries from allow-listed fields and values (`VALID_DEPARTMENTS`, `VALID_STATUSES` and so on). It never executes raw model output.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Supabase Account** (free at [supabase.com](https://supabase.com))

## Installation

### Quick Start (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/Joshnaacsha/Theervu-Kaanal.git
   cd Theervu-Kaanal
   ```
2. **Install all dependencies**

   ```bash
   npm run install:all
   ```
3. **Configure environment variables**

   **Server (.env in server directory):**

   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   JWT_EXPIRY=24h
   GEMINI_API_KEY=your_gemini_api_key

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   **Client (.env in client directory):**

   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Setting up Supabase:**

   - Go to [https://supabase.com](https://supabase.com) and create a free account
   - Create a new project
   - Go to Project Settings > API
   - Copy the `URL` and `anon public` key to your `.env` files
   - The service role key can be found under "Project API keys" (use with caution, it bypasses Row Level Security)
4. **Start the application**

   ```bash
   npm start
   ```

   This will start both the backend server (port 5001) and frontend client (port 3000).

### Manual Installation

If you prefer to install and run components separately:

**Backend:**

```bash
cd server
npm install
npm start
```

**Frontend:**

```bash
cd client
npm install
npm start
```

## Usage

Once the application is running:

1. **Access the application:**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
2. **User Roles:**

   - **Petitioner** - Submit and track grievances
   - **Official** - Review and respond to grievances
   - **Admin** - Manage system, view analytics, and oversee all operations
3. **Features:**

   - Submit new grievances with document uploads
   - Track grievance status in real-time
   - Chat with assigned officials
   - Use AI chatbot for queries
   - Receive notifications on updates

## Available Scripts

From the root directory:

- `npm start` - Start both frontend and backend
- `npm run install:all` - Install dependencies for both client and server
- `npm run start:server` - Start only the backend server
- `npm run start:client` - Start only the frontend
- `npm run dev` - Start backend in development mode with nodemon
- `npm run build` - Build frontend for production

## Project Structure

```
Theervu-Kaanal/
├── client/                 # React frontend application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main App component
│   └── package.json
│
├── server/                # Node.js backend application
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── llm/             # AI/ML integration
│   ├── scripts/         # Utility scripts
│   ├── uploads/         # File upload directory
│   ├── server.js        # Server entry point
│   └── package.json
│
├── package.json          # Root package.json
└── README.md            # This file
```

## Environment Variables

### Server (.env)

| Variable                      | Description                             | Required |
| ----------------------------- | --------------------------------------- | -------- |
| `PORT`                      | Server port number                      | Yes      |
| `MONGODB_URI`               | MongoDB connection string               | Yes      |
| `JWT_SECRET`                | Secret key for JWT tokens               | Yes      |
| `JWT_EXPIRY`                | JWT token expiration time               | Yes      |
| `NODE_ENV`                  | Environment (development/production)    | Yes      |
| `GEMINI_API_KEY`            | Google Gemini API key                   | Yes      |
| `SUPABASE_URL`              | Supabase project URL                    | Yes      |
| `SUPABASE_ANON_KEY`         | Supabase anonymous key                  | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Yes      |

### Client (.env)

| Variable                        | Description            | Required |
| ------------------------------- | ---------------------- | -------- |
| `REACT_APP_SUPABASE_URL`      | Supabase project URL   | Yes      |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes      |

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Grievances

- `GET /api/grievances` - Get all grievances
- `POST /api/grievances` - Submit new grievance
- `GET /api/grievances/:id` - Get specific grievance
- `PUT /api/grievances/:id` - Update grievance
- `DELETE /api/grievances/:id` - Delete grievance

### Chat

- `POST /api/chat/create` - Create chat channel
- `GET /api/chat/:channelId` - Get chat messages

### Admin

- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/assign` - Assign grievance to official

## Development

### Running with Nodemon (Auto-reload)

For development with automatic server restart:

```bash
npm run dev
```

### Database Scripts

The project includes utility scripts in `server/scripts/`:

- `checkEscalations.js` - Monitor and escalate pending cases
- `checkRepetitiveCases.js` - Detect recurring grievances
- `createTestOfficials.js` - Generate test official accounts
- `migrateGrievanceId.js` - Database migration script

## Troubleshooting

### Port Already in Use

If you get an error that port 5001 or 3000 is already in use:

```bash
# Find and kill the process (macOS/Linux)
lsof -ti:5001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

The server defaults to 5001 because on macOS port 5000 is taken by AirPlay Receiver (System Settings → General → AirDrop & Handoff).

### MongoDB Connection Issues

- Ensure MongoDB is running locally or your Atlas connection string is correct
- Check network connectivity
- Verify credentials in .env file

### Missing Dependencies

```bash
# Clear node_modules and reinstall
rm -rf client/node_modules server/node_modules
npm run install:all
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Contact

Project Link: [https://github.com/Joshnaacsha/Theervu-Kaanal](https://github.com/Joshnaacsha/Theervu-Kaanal)

## Acknowledgments

- Google Gemini AI for smart query assistance
- Stream Chat for real-time messaging infrastructure
- MongoDB for database management
- React and Material-UI for frontend framework
