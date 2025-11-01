# Participium

## System General Goal

The Municipality of Turin is developing **Participium**, a web application for citizen participation in the management of urban environments.
It allows citizens to interact with the public administration by reporting inconveniences and malfunctions present in the area (e.g., potholes in the asphalt, sidewalks with architectural barriers, trash on the streets, non-functioning streetlights, etc.).

A real example of such an application is the **Iris platform** in Venice.

---

## Reports

Citizens can submit reports **only if they have registered** in the system with:

* Email
* Username
* First name
* Last name

Once registered, the citizen can make reports by:

1. Selecting a point on the **Turin map** (based on OpenStreetMap, standard layer)
2. Filling out a form with the following required fields:

   * **Title**
   * **Textual description**
   * **Category** (chosen from a list)
   * **At least one photo** (up to 3 per report)

### Possible Problem Categories

* Water Supply – Drinking Water
* Architectural Barriers
* Sewer System
* Public Lighting
* Waste
* Road Signs and Traffic Lights
* Roads and Urban Furnishings
* Public Green Areas and Playgrounds
* Other

After entering all the required information and any pictures, the system asks the citizen if they want the report to be **anonymous** (name not visible in the public list of reports).

---

## Report Lifecycle

Once submitted, the report is in the **Pending Approval** state until the Organization Office of the Municipality of Turin performs a preliminary verification, marking the report as either **accepted** or **rejected**.

### Possible Report Statuses

* Pending Approval
* Assigned
* In Progress
* Suspended
* Rejected
* Resolved

**Lifecycle Flow:**

1. **Pending Approval** → waiting for verification by the Organization Office
2. **Assigned** → report sent to the competent technical office depending on the category
3. **In Progress** → intervention scheduled and started
4. **Suspended** → awaiting further evaluation or resources
5. **Resolved** → issue fixed, report closed (technical staff can add comments)
6. **Rejected** → requires a **mandatory explanation** from the Organization Office

---

## Citizen Updates

To strengthen trust between citizens and institutions, citizens are kept updated about their reports through various channels:

* **Platform notifications** at each status change
* **Messages** from municipal operators (citizens can reply within the platform)
* **Email notifications**, sent for every platform notification

  * Email notifications can be disabled in the user’s configuration panel
  * Citizens can also upload a **personal photo** and their **Telegram username** in this panel

### Public Visibility

After approval, accepted reports immediately become visible on the Participium portal. They appear both:

1. **On an interactive map of Turin**, geolocated at the indicated point
2. **In a summary table**, allowing:

   * Filtering and sorting by category, status, or period
   * Data export as a **CSV file**

In both views, the reporter’s name is shown (or **“anonymous”** if chosen), along with the report title.
Clicking the title opens the full description with attached photos (if present).

---

## Statistics

The system provides both **public** and **private** statistics.

### Public Statistics

(visible also to unregistered users)

* Number of reports by category
* Trends by day, week, or month

### Private Statistics

(visible only to administrators, includes public stats + additional data)

* Number of reports by status
* Number of reports by type
* Number of reports by type and status
* Number of reports by reporter
* Number of reports by reporter and type
* Number of reports by reporter, type, and status
* Number of reports by the **top 1% of reporters**, by type
* Number of reports by the **top 5% of reporters**, by type

---

## Interaction with Telegram Bot

Citizens who have provided their **Telegram username** can interact with a **Telegram bot** to:

* Create a new report through a guided process
* Check the status of their own reports (with updated lists and status changes)
* Receive **real-time push notifications** when a report changes status
* Get quick assistance via commands (system usage info and useful contacts)
