<!-- markdownlint-disable MD041 -->

## Participium

Participium is a web application for citizen participation in the management of urban environments (e.g., potholes, architectural barriers, waste, broken streetlights). It supports reporting issues on a map, tracking the report lifecycle, and notifying citizens through in-app notifications and email.

### Quick links

- **Docker**: [Docker setup](docker/README.md)
- **Backend API docs (Swagger)**: `http://localhost:3001/api-docs`
- **SendGrid (email provider)**: [SendGrid setup](SENDGRID_SETUP.md)
- **Telegram bot**: [Telegram bot setup](TELEGRAM_BOT_SETUP.md) and [commands](TELEGRAM_BOT_COMMANDS.txt)

---

### Quickstart (Docker)

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Then open:

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Swagger**: `http://localhost:3001/api-docs`

To stop:

```bash
docker compose -f docker/docker-compose.yml down
```

To reset the database volume:

```bash
docker compose -f docker/docker-compose.yml down -v
```

---

### Local development (without Docker)

#### Prerequisites

- Node.js 20+

#### Backend (Express + SQLite)

From the repository root:

```bash
npm install
npm run dev
```

The backend listens on **PORT 3001** by default and serves Swagger at `http://localhost:3001/api-docs`.

#### Frontend (Vite + React)

In a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` (the backend CORS policy is configured for that origin).

---

### Configuration (.env)

The backend loads environment variables from a **root** `.env` file (repository root). The following variables are supported:

- **Backend**
  - **PORT**: backend port (default: `3001`)
  - **NODE_ENV**: set to `test` during automated tests
- **Email**
  - **EMAIL_PROVIDER**: `sendgrid` or `smtp`
  - **SENDGRID_API_KEY**: required if `EMAIL_PROVIDER=sendgrid`
  - **EMAIL_FROM**: sender address (recommended; required for SendGrid)
  - **EMAIL_SERVICE / EMAIL_USER / EMAIL_PASS**: for SMTP service presets (e.g. Gmail/Hotmail)
  - **EMAIL_HOST / EMAIL_PORT / EMAIL_SECURE / EMAIL_USER / EMAIL_PASS**: for custom SMTP
- **Telegram bot (optional)**
  - **TELEGRAM_BOT_TOKEN**: enables bot initialization on server start
  - **TELEGRAM_WEBHOOK_URL**: optional; for webhook mode instead of polling

Notes:

- **Docker**: `docker/docker-compose.yml` only sets `PORT` and `NODE_ENV` for the backend. If you want email/Telegram features in Docker, add the relevant variables to the backend service `environment:` section.

---

### Testing

From the repository root:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

End-to-end tests live under `client/cypress/` (Cypress is installed in `client/`).

---

## Functional overview

### Reports

Citizens can submit reports **only if they have registered** in the system with:

- Email
- Username
- First name
- Last name

Once registered, the citizen can make reports by:

1. Selecting a point on the **Turin map** (based on OpenStreetMap, standard layer)
2. Filling out a form with the following required fields:

   - **Title**
   - **Textual description**
   - **Category** (chosen from a list)
   - **At least one photo** (up to 3 per report)

#### Possible Problem Categories

- Water Supply – Drinking Water
- Architectural Barriers
- Sewer System
- Public Lighting
- Waste
- Road Signs and Traffic Lights
- Roads and Urban Furnishings
- Public Green Areas and Playgrounds
- Other

After entering all the required information and any pictures, the system asks the citizen if they want the report to be **anonymous** (name not visible in the public list of reports).

---

### Report Lifecycle

Once submitted, the report is in the **Pending Approval** state until the Organization Office of the Municipality of Turin performs a preliminary verification, marking the report as either **accepted** or **rejected**.

#### Possible Report Statuses

- Pending Approval
- Assigned
- In Progress
- Suspended
- Rejected
- Resolved

**Lifecycle Flow:**

1. **Pending Approval** → waiting for verification by the Organization Office
2. **Assigned** → report sent to the competent technical office depending on the category
3. **In Progress** → intervention scheduled and started
4. **Suspended** → awaiting further evaluation or resources
5. **Resolved** → issue fixed, report closed (technical staff can add comments)
6. **Rejected** → requires a **mandatory explanation** from the Organization Office

---

### Citizen Updates

To strengthen trust between citizens and institutions, citizens are kept updated about their reports through various channels:

- **Platform notifications** at each status change
- **Messages** from municipal operators (citizens can reply within the platform)
- **Email notifications**, sent for every platform notification

  - Email notifications can be disabled in the user’s configuration panel
  - Citizens can also upload a **personal photo** and their **Telegram username** in this panel

#### Public Visibility

After approval, accepted reports immediately become visible on the Participium portal. They appear both:

1. **On an interactive map of Turin**, geolocated at the indicated point
2. **In a summary table**, allowing:

   - Filtering and sorting by category, status, or period
   - Data export as a **CSV file**

In both views, the reporter’s name is shown (or **“anonymous”** if chosen), along with the report title.
Clicking the title opens the full description with attached photos (if present).

---

### Statistics

The system provides both **public** and **private** statistics.

#### Public Statistics

(visible also to unregistered users)

- Number of reports by category
- Trends by day, week, or month

#### Private Statistics

(visible only to administrators, includes public stats + additional data)

- Number of reports by status
- Number of reports by type
- Number of reports by type and status
- Number of reports by reporter
- Number of reports by reporter and type
- Number of reports by reporter, type, and status
- Number of reports by the **top 1% of reporters**, by type
- Number of reports by the **top 5% of reporters**, by type

---

### Interaction with Telegram Bot

Citizens who have provided their **Telegram username** can interact with a **Telegram bot** to:

- Create a new report through a guided process
- Check the status of their own reports (with updated lists and status changes)
- Receive **real-time push notifications** when a report changes status
- Get quick assistance via commands (system usage info and useful contacts)
