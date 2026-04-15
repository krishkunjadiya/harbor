ABSTRACT


Tourifyy is a full-stack web platform designed to help modern travelers plan nature-centric trips with a strong emphasis on sustainability, safety, and community engagement. The platform addresses a significant gap in existing travel-tech solutions: most booking platforms provide standard itinerary suggestions but lack a sustainability-first approach, dedicated safety tools for outdoor tourism, and a mechanism for sharing community-verified travel experiences.

Tourifyy integrates four key dimensions into a single unified interface: AI-assisted trip planning, destination discovery, traveler safety preparedness, and social storytelling. The system is built on a modern technology stack comprising Next.js (React) on the frontend, Node.js and Express on the backend, and Firebase Firestore as the cloud database. Authentication is handled via JSON Web Tokens (JWT), while Google Generative AI (Gemini) powers the conversational travel assistant.

Key features include: an AI-assisted day-by-day itinerary generator; a Destinations and Trails Explorer with dual map support (Google Maps and OpenStreetMap/Leaflet); a role-based Booking Workflow with Admin approval; Nature Guard for travel readiness monitoring; Offline Survival Packs (downloadable first aid, emergency contacts, phrasebooks) that function without internet; Tribal Sync for community storytelling; Wildlife Insight encyclopedia; and a Global Sanctuary explorer.

The project demonstrates a complete end-to-end platform architecture with role-based management (Admin and Customer portals), data integrity through Firebase Firestore, security via JWT and bcrypt, and an extensible design ready for real-world API integrations. Future enhancements include real external weather/ecosystem APIs, fully LLM-generated itineraries, user favourite persistence, AI-powered wildlife image identification, and production-grade security hardening.
â€ƒ

CONTENTS

Sr. No.	Title	Page No.
I	Certificate	ii
II	Acknowledgement	iii
III	Abstract	iv
IV	Contents	v
1.	Chapter 1: Introduction & Objectives	1
2.	Chapter 2: System Analysis	3
2a.	Identification of Need	3
2b.	Preliminary Investigation	4
2c.	Feasibility Study	4
2d.	Project Planning	5
2e.	Software Requirement Specifications (SRS)	6
2f.	Software Engineering Paradigm Applied	7
2g.	Data Models, Diagrams & Use-Case	7
3.	Chapter 3: System Design	10
3a.	Modularisation Details	10
3b.	Database Design (Firebase Firestore Collections)	11
3c.	User Interface Design	12
3d.	Test Cases	12
4.	Chapter 4: Tech Stack Details	14
5.	Chapter 5: API Design	15
6.	Chapter 6: Coding & Implementation	17
7.	Chapter 7: Standardisation of Coding	19
8.	Chapter 8: Testing	20
9.	Chapter 9: System Security Measures	21
10.	Chapter 10: Cost Estimation	22
11.	Chapter 11: Future Scope & Further Enhancement	23
12.	Chapter 12: Bibliography	24
13.	Chapter 13: Glossary	25
â€ƒ
CHAPTER 1
INTRODUCTION & OBJECTIVES

1.1 Overview
Tourifyy is a full-stack web platform designed to help travelers plan nature-centric trips with a strong focus on sustainability, safety, and community. It combines modern web technologies with AI capabilities to offer a unified travel experience beyond conventional booking platforms.
The platform provides:
â€¢	An AI-assisted trip planner that generates day-by-day itineraries based on user preferences.
â€¢	A booking workflow with role-based admin approval (pending â†’ approved / rejected).
â€¢	Safety modules including Nature Guard (ecosystem and weather indicators) and Offline Survival Packs (first aid, emergency contacts, SOS messaging) for low-connectivity conditions.
â€¢	A community feed â€” Tribal Sync â€” for sharing travel experiences and stories.
â€¢	A Wildlife Insight encyclopedia with species statistics and sightings logging.
â€¢	A Global Sanctuary explorer organizing eco-focused destinations geographically.
1.2 Problem Statement
Trip planning platforms commonly provide standard booking and itinerary suggestions but often lack:
â€¢	A sustainability-first approach â€” eco-focused guidance and low-impact travel suggestions.
â€¢	A dedicated safety layer for nature and outdoor tourism â€” offline emergency references and SOS tools.
â€¢	A community mechanism for sharing verified, experience-based travel knowledge.
â€¢	A unified interface combining planning, discovery, community, and safety.
Tourifyy addresses these gaps by integrating all four dimensions into one platform.
1.3 Core Objectives
â€¢	Build a role-based platform with Admin and Customer portals.
â€¢	Provide an AI-assisted itinerary generator that adapts to user inputs (destination, dates, budget, travel styles).
â€¢	Offer a Destination and Trails Explorer with interactive map visualization.
â€¢	Implement a Bookings system with status tracking and admin management.
â€¢	Add Nature Guard monitoring (simulated real-time data) for travel readiness.
â€¢	Provide Offline Survival Packs for emergency preparedness and offline usage.
â€¢	Build Tribal Sync for community storytelling and engagement.
â€¢	Provide Wildlife Insight browsing, filters, and sightings logging.
1.4 Users & Roles
The system defines two primary user roles:
â€¢	Customer (Explorer): Plans trips, creates booking requests, uses all feature modules, and posts in the community.
â€¢	Admin: Manages users, destinations, bookings, platform settings, and offline packs.
1.5 Scope & Notes
The platform's current runtime backend uses Firebase Firestore via the Firebase Admin SDK. The repository also contains legacy MongoDB/Mongoose artifacts from earlier iterations; the active server implementation is entirely Firestore-based. Some modules use deterministic simulations (e.g., Nature Guard) to demonstrate UX and data flow without relying on paid external APIs.
â€ƒ
CHAPTER 2
SYSTEM ANALYSIS

2a. Identification of Need
The travel industry has seen a surge in eco-tourism and outdoor nature travel. However, existing platforms focus primarily on commercial bookings and lack tools for sustainable travel guidance, offline safety preparedness, and community-driven knowledge sharing. There is a clear need for a platform that:
â€¢	Guides travelers to make environmentally responsible choices.
â€¢	Provides safety information in areas with limited or no connectivity.
â€¢	Fosters a community of like-minded eco-travelers sharing firsthand experiences.
â€¢	Consolidates planning, booking, discovery, and safety into one experience.
2b. Preliminary Investigation
During the preliminary investigation phase, existing travel platforms (MakeMyTrip, TripAdvisor, Airbnb Experiences, iNaturalist) were reviewed. The investigation revealed:
â€¢	No platform offered offline survival packs or SOS tools for nature travelers.
â€¢	Eco-tourism features were either absent or token additions, not core to the product.
â€¢	Community content lacked structured travel-style tagging and eco-certification.
â€¢	Itinerary generators did not adapt dynamically to eco-travel preferences.
This confirmed the viability and uniqueness of Tourifyy's proposed feature set.
2c. Feasibility Study
Technical Feasibility
The project leverages proven open-source frameworks (Next.js, Node.js, Express) and managed services (Firebase Firestore, Google Generative AI). The technology stack is well-documented and widely adopted, ensuring technical feasibility within an academic project timeline.
Operational Feasibility
The platform is designed for ease of use with clear role separation. Admin operations are straightforward CRUD workflows. Customer flows follow familiar travel-booking UX patterns.
Economic Feasibility
Firebase's free tier (Spark Plan) and open-source frameworks allow development and demonstration at zero cost. Scaling to production would require Firebase Blaze (pay-as-you-go) and a hosting service such as Vercel (frontend) and Render (backend).
2d. Project Planning
The project was executed across the following phases:

Phase	Activities	Duration
Phase 1: Research	Requirements gathering, competitive analysis, tech stack selection	2 Weeks
Phase 2: Design	Architecture design, database schema, UI wireframes	2 Weeks
Phase 3: Backend Dev	Express API setup, Firebase integration, JWT auth, seeding	3 Weeks
Phase 4: Frontend Dev	Next.js App Router, all feature modules, map integration	4 Weeks
Phase 5: Integration	Frontend-backend connection, offline service worker, AI chat	2 Weeks
Phase 6: Testing	Manual testing, seed validation, booking flow verification	1 Week
Phase 7: Deployment	Render backend deployment, environment config, documentation	1 Week

2e. Software Requirement Specifications (SRS)
Functional Requirements
â€¢	FR01: The system shall allow users to register and log in with email and password.
â€¢	FR02: The system shall support two roles: Admin and Customer.
â€¢	FR03: Customers shall be able to generate AI-assisted trip itineraries.
â€¢	FR04: Customers shall be able to browse destinations and trails on an interactive map.
â€¢	FR05: Customers shall be able to create booking requests with status tracking.
â€¢	FR06: Admins shall be able to approve, reject, or cancel booking requests.
â€¢	FR07: Admins shall be able to perform full CRUD operations on destinations.
â€¢	FR08: Customers shall be able to download offline survival packs.
â€¢	FR09: The system shall display nature readiness indicators via Nature Guard.
â€¢	FR10: Customers shall be able to create and like community posts (Tribal Sync).
â€¢	FR11: The system shall provide a Wildlife Insight encyclopedia with filters and sighting logs.
â€¢	FR12: A conversational AI assistant (Tourify Spirit) shall answer travel queries.
Non-Functional Requirements
â€¢	NFR01: The system shall respond to API requests within 2 seconds under normal load.
â€¢	NFR02: Passwords shall be hashed using bcrypt before storage.
â€¢	NFR03: JWT tokens shall expire within 24 hours.
â€¢	NFR04: The frontend shall be mobile-responsive using Tailwind CSS.
â€¢	NFR05: Offline packs shall remain accessible without internet connectivity.
â€¢	NFR06: The system shall support concurrent users without data inconsistency.
2f. Software Engineering Paradigm Applied
Tourifyy follows the Incremental Development Model. The platform was built in incremental releases â€” starting with core authentication and destination CRUD, followed by booking workflows, then feature modules (Nature Guard, Wildlife Insight, Tribal Sync, Offline Packs), and finally AI integration. This approach allowed early validation of core flows before investing in complex features.
Component-based architecture principles were applied on the frontend (Next.js components), and RESTful API design principles were applied on the backend (Express route groups). This separation of concerns ensures maintainability and extensibility.
2g. Data Models, Diagrams & Use-Case
High-Level System Architecture
The system follows a three-tier architecture:
â€¢	Presentation Tier: Next.js (React) frontend with Tailwind CSS styling.
â€¢	Application Tier: Node.js + Express REST API backend with JWT-based security.
â€¢	Data Tier: Firebase Firestore cloud database with Firebase Admin SDK.

Use-Case Summary
Actor	Use Case	Description
Customer	Register / Login	Create account or authenticate with JWT
Customer	Plan Trip	Generate AI itinerary with destination, dates, budget, style
Customer	Book Trip	Submit booking request; track approval status
Customer	Download Offline Pack	Save survival data to localStorage for offline use
Customer	Browse Wildlife	Filter and log wildlife sightings
Customer	Post Story	Share travel experience on Tribal Sync community feed
Admin	Manage Users	View, update roles, delete user accounts
Admin	Manage Destinations	Full CRUD on destination records and itineraries
Admin	Manage Bookings	Approve, reject, or cancel customer bookings
Admin	Configure Settings	Set activity cost multiplier and offline pack controls
â€ƒ
CHAPTER 3
SYSTEM DESIGN

3a. Modularisation Details
The system is divided into the following major modules:

Module	Location	Responsibility
Auth Module	Backend /api/auth	User registration, login, JWT token management
World Module	Backend /api/world	Destinations, trails, planner settings
Admin Module	Backend /api/admin	User/destination/booking management, stats
Bookings Module	Backend /api/bookings	Create bookings, track status, admin updates
Offline Module	Backend /api/offline	Pack listing and offline pack content delivery
Nature Guard	Backend /api/nature-guard	Ecosystem/weather readiness (simulated)
Tribal Sync	Backend /api/tribe	Community posts, likes
Wildlife Insight	Backend /api/wildlife	Encyclopedia, stats, sightings
Sanctuary	Backend /api/sanctuary	Grouped eco-destination explorer
AI Spirit	Backend /api/spirit	Gemini AI travel assistant with keyword fallback
Frontend Pages	frontend/app/	Next.js App Router pages for all features
Service Worker	frontend/public/	Offline app-shell caching

3b. Database Design â€” Firebase Firestore Collections
Tourifyy uses Firebase Firestore as its cloud database. The following collections are defined:
users
â€¢	name, email (unique), password (bcrypt hash), role (admin | customer)
â€¢	phone, location, createdAt, updatedAt
destinations
â€¢	name, country, category, image, price, rating, reviews
â€¢	description, tags[], bestTime, natureFocus, coordinates (lat, lng)
â€¢	Optional: accommodations[], rentals[], itinerary[] (admin-curated)
trails
â€¢	name, location, difficulty, distance, elevationGain, createdAt
bookings
â€¢	userId, userName, userEmail, destination, travelers, budget
â€¢	startDate, endDate, styles[], itinerary, totalCost
â€¢	status (pending | approved | rejected | cancelled), createdAt, updatedAt
tribePosts
â€¢	authorName, authorAvatar, destination, country, image, title, story
â€¢	tags[], likes, comments, category, travelStyle, rating, isEcoCertified
â€¢	createdAt, updatedAt
wildlife
â€¢	name, scientificName, type (Flora | Fauna), species group
â€¢	image, description, funFact, habitat[], foundIn[], tags[]
â€¢	conservationStatus, isEndangered, bestSpottingTime, sightings
Other Collections
â€¢	notifications â€” title, message, type (info | success | alert), isRead, createdAt
â€¢	planner_settings â€” activityCostMultiplier, updatedAt, updatedBy
â€¢	offline_pack_settings â€” enabled, isPublic, packVersion, packSizeMB, updatedAt
â€¢	feedback â€” userId, name, rating (1â€“5), content, createdAt
3c. User Interface Design
The frontend is built with Next.js App Router, TypeScript, and Tailwind CSS. Key UI design decisions include:
â€¢	Role-based portal separation: Admin Dashboard and Customer Dashboard have distinct navigation and layouts.
â€¢	Dual map support: Google Maps (via @react-google-maps/api) and OpenStreetMap via Leaflet, with dynamic imports to prevent SSR errors.
â€¢	Offline-aware UI: Online/offline status indicators are shown; offline pack content is accessible without connectivity.
â€¢	Framer Motion animations for transitions and interactive elements.
â€¢	jsPDF and jspdf-autotable for client-side PDF invoice generation.
â€¢	Radix UI components and lucide-react icons for a consistent, accessible component library.
3d. Test Cases

Test Case ID	Feature	Steps	Expected Result
TC01	User Registration	POST /api/auth/register with valid data	201 Created, user stored in Firestore
TC02	User Login	POST /api/auth/login with correct credentials	200 OK, JWT token returned
TC03	Login Fail	POST /api/auth/login with wrong password	401 Unauthorized
TC04	Create Booking	POST /api/bookings (auth customer)	201 Created, status = pending
TC05	Admin Approve Booking	PUT /api/bookings/:id/status (admin, status=approved)	200 OK, status updated to approved
TC06	Offline Pack Download	GET /api/offline/pack/:destinationId	200 OK, pack data returned and stored
TC07	Wildlife Sighting Log	PUT /api/wildlife/:id/sight	200 OK, sightings count incremented
TC08	Tribal Sync Like	PUT /api/tribe/:id/like	200 OK, likes count incremented
TC09	Admin Destination CRUD	POST, PUT, DELETE /api/admin/destinations	Destination created/updated/deleted in Firestore
TC10	Role Protection	Customer accessing /api/admin/* endpoint	403 Forbidden â€” role check enforced
â€ƒ
CHAPTER 4
TECH STACK DETAILS

4.1 Frontend

Package	Version	Purpose
next	16.0.10	React framework with App Router
react / react-dom	19.2.0	Core UI library
typescript	^5	Type-safe JavaScript
tailwindcss	^4.1.9	Utility-first CSS framework
firebase (client SDK)	^12.10.0	Firebase Auth + Firestore client
framer-motion	^12.34.0	Animation library
leaflet / react-leaflet	^1.9.4 / ^5.0.0	OpenStreetMap-based interactive maps
@react-google-maps/api	^2.20.8	Google Maps integration
jspdf / jspdf-autotable	^4.2.0 / ^5.0.7	PDF invoice generation

4.2 Backend

Package	Version	Purpose
express	^4.18.2	REST API framework
firebase-admin	^13.0.0	Firestore access via Admin SDK
jsonwebtoken	^9.0.3	JWT authentication
bcryptjs	^3.0.3	Password hashing
@google/generative-ai	^0.24.1	Gemini AI integration (Tourify Spirit)
nodemon	latest	Hot reload during development

4.3 Deployment
â€¢	Backend: Configured for Render.com via render.yaml (listens on 0.0.0.0, port 10000).
â€¢	Frontend: Next.js-compatible; deployable on Vercel or similar platforms.
â€¢	Database: Firebase Firestore (serverless, auto-scaling cloud document database).
â€ƒ
CHAPTER 5
API DESIGN â€” BACKEND ROUTES SUMMARY

5.1 Authentication â€” /api/auth
â€¢	POST /api/auth/register â€” Register a new customer account (role forced to customer).
â€¢	POST /api/auth/login â€” Authenticate user; returns signed JWT.
â€¢	GET /api/auth/dev-admin â€” Creates a developer admin account for testing.
5.2 World & Discovery â€” /api/world
â€¢	GET /api/world/destinations â€” Retrieve all destinations.
â€¢	GET /api/world/trails â€” Retrieve all trails.
â€¢	GET /api/world/planner-settings â€” Retrieve planner configuration (activityCostMultiplier).
5.3 Admin â€” /api/admin
â€¢	GET /api/admin/stats â€” Platform-level metrics.
â€¢	GET /api/admin/users â€” List all users.
â€¢	GET /api/admin/users/:id/details â€” User profile and booking history.
â€¢	PUT /api/admin/users/:id/role â€” Update user role.
â€¢	DELETE /api/admin/users/:id â€” Delete user account.
â€¢	POST | PUT | DELETE /api/admin/destinations â€” Full destination CRUD.
â€¢	GET | PUT /api/admin/planner-settings â€” View and update planner settings.
â€¢	GET | PUT /api/admin/offline-packs/:id â€” Manage offline pack metadata.
5.4 Bookings â€” /api/bookings
â€¢	POST /api/bookings â€” Create a new booking request (customer auth required).
â€¢	GET /api/bookings/my â€” Retrieve customer's own bookings.
â€¢	GET /api/bookings/all â€” Admin view of all bookings.
â€¢	PUT /api/bookings/:id/status â€” Admin updates booking status.
5.5 Feature Module Routes
â€¢	GET /api/nature-guard â€” Ecosystem and weather readiness data.
â€¢	GET /api/sanctuary â€” Eco-destinations grouped by continent.
â€¢	GET | POST /api/tribe â€” Community posts; PUT /api/tribe/:id/like â€” Like a post.
â€¢	GET /api/wildlife â€” Wildlife encyclopedia; PUT /api/wildlife/:id/sight â€” Log sighting.
â€¢	GET /api/offline/destinations | /api/offline/pack/:destinationId â€” Offline pack data.
â€¢	GET | PATCH /api/notifications/:id/read â€” Notifications management.
â€¢	GET | POST /api/feedback â€” Feedback submission and listing.
â€¢	POST /api/spirit/chat â€” Gemini AI chat with keyword fallback.
â€ƒ
CHAPTER 6
CODING & IMPLEMENTATION

6a. Authentication & Security
User registration hashes passwords using bcryptjs before storage in Firestore. On login, the backend verifies the hashed password and issues a JWT signed with JWT_SECRET (1-day expiry). The JWT is stored in the browser's sessionStorage by the frontend and sent as a Bearer token on subsequent API requests. Protected routes verify the token and extract the user role before processing the request.
6b. Admin Portal Implementation
Dashboard Statistics
The Admin dashboard fetches platform-level metrics from GET /api/admin/stats â€” total users, admins, customers, bookings, and system status indicators â€” and displays them in a summary card layout.
Destination Management
Admins can create, update, and delete destinations. Each destination record includes core fields (name, country, image, price, category, description, rating, tags, bestTime, coordinates) and optional enrichment arrays (accommodations, rentals, and admin-curated itineraries used by the trip planner).
Booking Administration
The Admin portal lists all bookings and allows status updates (pending / approved / rejected / cancelled). Booking status changes are persisted in Firestore and reflected in real-time on the Customer portal.
Offline Pack Controls
Admins can enable/disable offline packs per destination, toggle public visibility, and update pack version and size metadata stored in the offline_pack_settings collection.
6c. Customer Portal Implementation
AI-Assisted Trip Planner
The planner follows a multi-step flow: (1) destination selection with Google Places Autocomplete, (2) date selection, (3) travelers, budget, and travel style preferences, (4) itinerary generation. If an admin-curated itinerary exists for the destination, it is used and auto-extended to match the trip duration. The generated plan is stored as a pending booking locally and forwarded to booking confirmation.
Destinations & Trails Explorer
Fetches destinations and trails from the backend and renders them with search, sort, and filter controls. Map view supports both Google Maps (marker + info window) and Leaflet/OpenStreetMap (marker + popup). Dynamic imports are used to safely load map libraries on the client side and prevent server-side rendering issues.
Offline Survival Mode
The Offline Survival Pack feature lists destinations with downloadable packs containing emergency contacts, first aid guides, multi-language phrasebooks, trail information, and SOS configuration. Packs are stored in localStorage using a download-once model, ensuring availability without internet connectivity. A Service Worker caches the app-shell (core routes) for offline navigation, while API calls use a network-first strategy that returns a structured 503 JSON error when offline.
PDF Invoice Generation
After a booking is confirmed or approved, the Customer portal generates a downloadable PDF invoice using jsPDF and jspdf-autotable, including booking details, itinerary summary, cost breakdown, and booking reference.
â€ƒ
CHAPTER 7
STANDARDISATION OF CODING

7a. Code Efficiency & Error Handling
â€¢	All Express route handlers are wrapped with async/await and include try-catch blocks to prevent unhandled rejections.
â€¢	Firestore operations use typed document access patterns via the Firebase Admin SDK.
â€¢	Frontend API calls include error state handling with user-facing toast notifications.
â€¢	The AI Spirit module includes a keyword-based fallback to prevent failure when the Gemini API is unavailable.
7b. Parameters Calling / Passing
â€¢	Route parameters (:id, :destinationId) are validated before Firestore lookup.
â€¢	Query parameters (search, sort, filter) are parsed and applied server-side where applicable.
â€¢	JWT payloads carry userId and role; both are verified at middleware level before route execution.
7c. Validation Checks
â€¢	Signup enforces unique email check against Firestore before creating a new user document.
â€¢	Role on public signup is hardcoded to customer regardless of payload content.
â€¢	Booking creation validates required fields (destination, dates, travelers, budget) before persistence.
â€¢	Admin role checks are enforced at middleware level â€” non-admin JWT access to admin routes returns 403 Forbidden.
â€ƒ
CHAPTER 8
TESTING

8a. Testing Techniques & Strategies Used
â€¢	Manual Black-Box Testing: All major user flows tested by executing them end-to-end through the browser.
â€¢	Boundary Testing: Edge cases such as empty itinerary, zero travelers, and past dates were tested.
â€¢	Role-based Access Testing: Verified that customer JWT tokens cannot access admin endpoints.
â€¢	Offline Testing: Browser DevTools Network throttling used to simulate offline conditions and verify Service Worker and localStorage survival pack behavior.
8b. Testing Plan
Testing was conducted across three phases: unit-level (individual API endpoint verification), integration-level (full frontend-to-backend flows), and system-level (complete user journeys from registration through booking and offline pack usage).
8c. Verified Flows
â€¢	Signup, login, and logout flow.
â€¢	Planner multi-step flow â†’ booking creation â†’ status tracking.
â€¢	Admin booking status update â†’ reflected on customer portal.
â€¢	Offline survival pack download â†’ offline access verification.
â€¢	Tribal Sync post creation and like persistence.
â€¢	Wildlife encyclopedia filters and sighting log increment.
â€¢	Nature Guard data refresh and alert rendering.
8d. Debugging & Code Improvement
Key issues identified and resolved during testing included: dynamic import necessity for Leaflet (browser-only library incompatible with Next.js SSR); CORS configuration set to permissive during development with a note for production tightening; Firestore credential loading order to support both service account file path and individual environment variables; and localStorage quota handling for large offline packs.
â€ƒ
CHAPTER 9
REPORTS

Figure 9.1 â€” Destinations & Trails Explorer
The Trails section displays all available trekking routes with tags (Historic, High Altitude, Zen, Alpine, Coastal), ratings, distance, elevation gain, and a 'Start Journey' button to begin trip planning.

 
Figure 9.1: Trails Explorer Page
Figure 9.2 â€” Destinations Grid View
The Destinations page shows city and cultural destinations with pricing (INR), ratings, best travel season, and estimated flight time from DEL/BOM. Users can click 'Plan Adventure' to jump directly into the AI Planner.

 
Figure 9.2: Destinations Grid Viewâ€ƒ
Figure 9.3 â€” Nature Guard (Live Monitoring)
The Nature Guard module shows real-time ecosystem health and weather conditions for each destination. Cards display temperature, humidity, wind speed, and trail quality (Excellent / Good / Fair). A sidebar panel highlights current weather conditions and alerts.

 
Figure 9.3: Nature Guard â€” Live Monitoring Dashboard
Figure 9.4 â€” Global Sanctuary Network
The Sanctuary page showcases 38+ eco-certified protected destinations across 27 countries and 7 continents. Users can filter by category (Adventure, Culture, Beach, Luxury) and by continent, and toggle between a continent-grouped view and an all-grid view.

 
Figure 9.4: Global Sanctuary Network
â€ƒ
Figure 9.5 â€” Tribal Sync (Community Feed)
The Tribal Sync module is a community storytelling feed where travelers share their journeys. Posts can be filtered by travel style (Solo, Couple, Family, Group) and category (Nature, Beach, Adventure, Culture, Romantic). Each post shows the author, location, eco-certification Credential, and a brief excerpt.

 
Figure 9.5: Tribal Sync â€” Community Feed
Figure 9.6 â€” Landing Page
The Tourifyy landing page greets visitors with the hero tagline 'Reconnect With Earth' and provides quick navigation to all platform features via the top navbar. Unauthenticated users are prompted to Sign In or Join Now.

 
Figure 9.6: Tourifyy Landing Page
Figure 9.7 â€” Customer Dashboard (Explorer Hub)
The Customer Dashboard (Explorer Hub) provides a personalized welcome panel showing total available destinations, tribe posts, active nature alerts, and unread notifications. The sidebar gives quick access to Bookings, AI Planner, Trails, Nature Guard, Sanctuary, Tribe, Wildlife, Travel Log, and Profile.

 
Figure 9.7: Customer Dashboard â€” Explorer Hub
â€ƒ
Figure 9.8 â€” Admin Portal (Dashboard Overview)
The Admin Portal provides a real-time platform overview showing total users (9), active nature alerts (1), eco certifications (342), and system status (Online). Admins can manage all 38 destinations, configure the AI Planner Activity Rate Multiplier, and edit destination records inline.

 
Figure 9.8: Admin Portal â€” Dashboard Overview
Figure 9.9 â€” Offline Survival Mode (Wilderness Safety Kit)
The Offline Survival page allows users to download per-destination survival packs that work 100% without internet. Each pack includes cached maps, first-aid guides, phrase books, emergency contacts, and an SOS beacon. The Monaco Riviera pack is shown as 'Offline Ready' with 7 guides, 2 contacts, and 1 language pack available.

 
Figure 9.9: Offline Survival Mode â€” Wilderness Safety Kit
â€ƒ
CHAPTER 10
SYSTEM SECURITY MEASURES

9a. Database / Data Security
â€¢	All passwords are hashed using bcryptjs (salt rounds = 10) before storage in Firestore. Plaintext passwords are never persisted.
â€¢	Firestore access is exclusively through the Firebase Admin SDK on the backend â€” the client never writes directly to Firestore in production flows.
â€¢	JWT tokens are signed with a secret key (JWT_SECRET) and expire after 24 hours, limiting the window of misuse from token theft.
9b. User Profiles & Access Rights
â€¢	Role-based access control is enforced at the middleware level on all protected routes.
â€¢	The customer role is enforced server-side on signup regardless of client payload.
â€¢	Admin-only routes return 403 Forbidden for non-admin JWT holders.
â€¢	Session storage is cleared on logout to remove the JWT from the browser.
9c. Production Hardening Recommendations
â€¢	Replace permissive CORS (Access-Control-Allow-Origin: *) with an explicit origin allowlist.
â€¢	Add request validation middleware (e.g., Zod or Joi schema validation) for all input payloads.
â€¢	Implement rate limiting on authentication endpoints to prevent brute-force attacks.
â€¢	Migrate from sessionStorage to HttpOnly cookies for JWT storage to mitigate XSS token theft.
â€¢	Enable Firebase Security Rules for Firestore to add a database-level access control layer.
â€ƒ
CHAPTER 11
COST ESTIMATION

10.1 Development Cost Estimation

Resource	Details	Estimated Cost
Frontend Development	Next.js, TypeScript, Tailwind CSS, map integration, offline features	In-house (Academic)
Backend Development	Node.js, Express, Firestore, JWT, AI integration	In-house (Academic)
Firebase Firestore	Spark (free) plan â€” sufficient for academic/demo scale	â‚¹0 / Free
Google Maps API	Free tier: 28,000 map loads/month	â‚¹0 (within free tier)
Google Generative AI	Gemini free tier â€” 15 RPM for testing	â‚¹0 (within free tier)
Render.com Hosting (Backend)	Free tier â€” auto-sleep after inactivity	â‚¹0 / Free
Vercel Hosting (Frontend)	Hobby plan â€” free for personal projects	â‚¹0 / Free

10.2 Estimated Production Scale Costs (Per Month)

Service	Plan	Estimated Cost (INR/Month)
Firebase Firestore	Blaze (pay-as-you-go)	~â‚¹800â€“2,000
Google Maps API	Beyond free tier	~â‚¹500â€“1,500
Gemini AI API	Paid tier	~â‚¹1,000â€“3,000
Render.com (Backend)	Starter paid tier	~â‚¹700â€“1,400
Vercel (Frontend)	Pro plan	~â‚¹1,700/month

Note: All production costs are approximate and depend on actual usage. The academic/demo deployment runs entirely within free tiers.
â€ƒ
CHAPTER 12
FUTURE SCOPE & FURTHER ENHANCEMENT

The current version of the Tourifyy platform demonstrates a full-stack architecture with AI integration, offline capabilities, and community features. There is a wide scope for future enhancements that can transform it into an even more powerful eco-travel platform.

â€¢	Real External API Integration: Replace simulated Nature Guard data with live weather APIs (OpenWeatherMap) and ecosystem health APIs for accurate travel readiness alerts.
â€¢	LLM-Generated Itineraries: Upgrade the trip planner from rule-based itinerary templates to fully Gemini-generated, grounded, personalized day-by-day plans with safety constraints and eco-travel guidance.
â€¢	Persistent User Favourites: Migrate favourite destinations from local UI state to Firestore for cross-device persistence and personalized recommendation feeds.
â€¢	AI Wildlife Image Identification: Integrate a computer vision pipeline (Google Cloud Vision or a custom model) to allow travelers to identify wildlife species from photos.
â€¢	Production Security Hardening: Implement HttpOnly cookie JWT storage, strict CORS origin allowlisting, input validation middleware, Firebase Security Rules, and rate limiting on authentication endpoints.
â€¢	Push Notifications: Add web push notifications for booking status changes and community activity using Firebase Cloud Messaging.
â€¢	Multi-Language Support (i18n): Extend the platform with full internationalization for broader accessibility, particularly relevant for the phrasebook feature.
â€¢	Carbon Footprint Tracker: Add a sustainability module that estimates and tracks the carbon footprint of planned trips and suggests lower-impact alternatives.

In summary, the future scope of the Tourifyy project is immense. By implementing backend enhancements, AI upgrades, mobile app development, and advanced sustainability features, the platform has the potential to become a leading eco-travel solution adopted by nature enthusiasts and institutions worldwide.
â€ƒ
CHAPTER 13
BIBLIOGRAPHY

[1] Next.js Documentation â€” https://nextjs.org/docs
[2] Firebase Firestore Documentation â€” https://firebase.google.com/docs/firestore
[3] Express.js Documentation â€” https://expressjs.com/
[4] Google Generative AI SDK â€” https://ai.google.dev/
[5] JSON Web Tokens (JWT) â€” https://jwt.io/introduction
[6] React Leaflet Documentation â€” https://react-leaflet.js.org/
[7] jsPDF Documentation â€” https://artskydj.github.io/jsPDF/
[8] Tailwind CSS Documentation â€” https://tailwindcss.com/docs
[9] bcryptjs â€” https://www.npmjs.com/package/bcryptjs
[10] Render.com Deployment Guide â€” https://render.com/docs
â€ƒ
CHAPTER 14
GLOSSARY

Term	Definition
API	Application Programming Interface â€” a set of rules for how software components communicate.
bcrypt	A password-hashing function used to securely store user passwords.
Firestore	Google Firebase's NoSQL cloud document database.
JWT	JSON Web Token â€” a compact, URL-safe token for authentication.
Next.js	A React-based web framework supporting server-side rendering and static generation.
REST	Representational State Transfer â€” an architectural style for designing networked APIs.
Service Worker	A browser script that runs in the background, enabling offline caching and push notifications.
SRS	Software Requirement Specification â€” a document describing what the software should do.
SSR	Server-Side Rendering â€” rendering pages on the server before sending to the client.
Gemini AI	Google's generative AI model used to power the Tourify Spirit conversational assistant.
CRUD	Create, Read, Update, Delete â€” the four basic operations for persistent storage.
Eco-Tourism	Tourism focused on minimizing environmental impact and supporting conservation.
Offline Pack	A downloadable bundle of safety and travel information accessible without internet.
Tribal Sync	Tourifyy's community feed module where travelers share stories and experiences.
Nature Guard	Tourifyy's travel readiness module showing ecosystem and weather safety indicators.
â€ƒ
CHAPTER 15
CONCLUSION

The Tourifyy project successfully demonstrates the potential of modern web technologies to enhance the travel experience for eco-conscious explorers. The primary objective of the system was to build a unified digital platform that integrates AI-assisted trip planning, sustainability-first destination discovery, community storytelling, and offline safety tools in a single interface accessible to both customers and administrators.

The system integrates several essential functionalities â€” such as AI-generated itineraries, interactive map exploration, role-based booking management, offline survival packs, community posts via Tribal Sync, and Wildlife Insight encyclopedia â€” within one cohesive full-stack platform. This not only simplifies the eco-travel planning experience but also introduces meaningful safety and sustainability features that are absent from conventional travel platforms.

A major accomplishment of the project is its secure, scalable architecture using Next.js, Node.js, Firebase Firestore, and Google Generative AI (Gemini). The component-based frontend and RESTful backend ensure maintainability and extensibility. Although the current version includes simulated data for certain modules, the overall structure is robust and ready for production-grade API integrations.

In conclusion, Tourifyy serves as a practical and innovative prototype for a next-generation eco-travel management platform. It lays a strong foundation for a fully functional, scalable, and intelligent travel ecosystem, and highlights the value of modern web development, AI, and offline-first design in solving real-world travel challenges.

