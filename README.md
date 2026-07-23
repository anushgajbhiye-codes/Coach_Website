# APEX Fitness Coaching System

A full-stack, dynamic system built for **APEX Fitness Coaching** featuring a premium public-facing marketing site and an interactive, JWT-authenticated coach admin dashboard.

## 🚀 Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite (managed with Prisma ORM)
- **Security**: JSON Web Tokens (JWT), bcryptjs for secure password hashing
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (AJAX, dynamic DOM injection)
- **Assets**: Multer file upload handling for before/after transformation photos, blog cover images, and client resource documents

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18.x or above)
- **NPM** (v9.x or above)

### Steps
1. **Clone the repository and navigate to the directory**:
   ```bash
   cd "E:/Coach Website"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize the Database**:
   Run the Prisma migrations and generate the Prisma Client:
   ```bash
   npm run setup
   ```

4. **Seed Default Data**:
   Populate the SQLite database with the default coach profile, pricing tiers, mock clients, inquiries, resources, and transformations:
   ```bash
   npm run prisma:seed
   ```

---

## 🚦 Running the Application

### Development Mode (with hot-reloading)
Starts the Express server with Nodemon:
```bash
npm run dev
```

### Production Mode
Starts the Express server with node:
```bash
npm start
```

Once started, access the pages at:
- **Public Website**: [http://localhost:5000/](http://localhost:5000/)
- **Coach Admin Dashboard**: [http://localhost:5000/admin.html](http://localhost:5000/admin.html)
---

## 💡 Key Features Implemented
1. **Live Dashboard Metrics**: Dynamic aggregations (active client counts, monthly revenue summing active plan values, new inquiries counts, consultation schedules).
2. **Client Management**: Complete CRUD operations on the active/inactive client ledger, including tracking progress metrics and search filtration.
3. **Inquiry Pipeline**: Submission pipeline from the public site's contact form into the admin inquiries console with replies and read-marking.
4. **Booking Scheduler**: Public strategy call scheduler feeding into the coach bookings section with approval/decline controls.
5. **APEX Journal (Blog)**: Image upload cover support for blog drafts or published articles displayed dynamically on the homepage with a reader overlay modal.
6. **Transformations Showcase**: Side-by-side before/after image uploads, duration/result text indicators, client consent check, and custom testimonials.
7. **Document Hub**: Secured progress plans, meal PDF grids, or public-facing downloads with automatic download counter logging.
8. **Live Polling**: Client-side polling refreshes the public site's transformations, blog posts, pricing plans, and resources every 30 seconds.
