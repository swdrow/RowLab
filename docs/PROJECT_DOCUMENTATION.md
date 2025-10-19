# RowLab - Project Documentation

**Last Updated:** 2025-10-19
**Version:** 1.0.0
**Status:** Initial Development Complete

---

## 1. Project Overview

### Purpose
RowLab is a web application designed for rowing coaches to create and manage boat lineups. It enables coaches to:
- Visually arrange athletes into different boat configurations
- Assign athletes to specific seats via drag-and-drop or click-to-assign
- Swap athletes between seats and boats
- View athlete headshots and basic information
- Save and export lineup configurations

### Current Status

#### ✅ Fully Implemented Features
- **Boat Display**: Complete visual representation with seat configurations (Port/Starboard)
- **Athlete Bank**: Display all athletes with headshots, country flags, and assignment status
- **Click-to-Assign**: Select athlete, click seat to assign
- **Drag-and-Drop**: Drag athletes from bank directly onto seats
- **Athlete Swapping**: Click two seats to swap athletes within or across boats
- **Lineup Management**: Add/remove boats, save to localStorage, export to JSON
- **Data Loading**: CSV parsing for athletes and boat configurations
- **Headshot Loading**: Dynamic image loading with fallback to placeholder

#### ⚠️ Skeleton Features (UI Ready, Awaiting Data)
- **Performance View**: Modal component structure created, needs erg data CSV
- **Side Capability Filtering**: UI present, needs Port/Starboard flags in athlete data
- **Side Validation Warnings**: Framework ready, needs capability data to activate

#### ❌ Not Implemented (Requirements Undefined)
- **Ranking System**: Component skeleton exists, but ranking methodology needs definition
- **Real-time Collaboration**: Future enhancement
- **Database Persistence**: Currently uses localStorage and JSON export

---

## 2. Architecture Decisions

### Infrastructure Choice: **Standalone Application**

**Decision:** RowLab runs as a **standalone application** separate from RowCast_API.

**Reasoning:**

1. **Technology Independence**
   - RowCast_API uses Flask (Python) backend
   - RowLab uses Node.js/Express (simpler for this use case)
   - No need to mix Python and Node.js ecosystems

2. **Separation of Concerns**
   - RowLab and RowCast_API serve completely different purposes
   - No shared functionality or data
   - Independent deployment and versioning

3. **Minimal Coupling**
   - Reduces risk of breaking RowCast_API during RowLab development
   - Easier to maintain and debug
   - Cleaner codebase organization

4. **Negligible Overhead**
   - Separate Node.js process is lightweight
   - Can still share nginx server (just different location block or subdomain)
   - Development is simpler with independent dev servers

5. **Deployment Flexibility**
   - Can run on same server or different servers
   - Can scale independently if needed
   - Easier to hand off or open-source separately

**Shared Resources:**
- nginx web server (different location blocks)
- Server hardware
- Nothing else

**Overhead Analysis:**
- Memory: ~50-100MB for Node.js process (negligible)
- CPU: Minimal when idle
- Ports: One additional port (3002 for API server, configurable)

### Tech Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Frontend Framework | React | 18.2.0 | Modern, widely-supported, excellent for interactive UIs |
| Build Tool | Vite | 5.0.11 | Fast development server, optimized builds |
| Styling | Tailwind CSS | 3.4.1 | Rapid UI development, consistent design system |
| Drag-and-Drop | @dnd-kit | 6.1.0 | Modern, accessible, performant (better than react-beautiful-dnd) |
| State Management | Zustand | 4.4.7 | Simple, lightweight, less boilerplate than Redux/Context |
| CSV Parsing | PapaParse | 5.4.1 | Robust, handles edge cases well |
| Charts | Recharts | 2.10.3 | React-friendly, good for line/bar charts |
| Backend | Express.js | 4.18.2 | Minimal API server for headshot serving |

### State Management: Zustand

**Why Zustand over React Context?**
- Less boilerplate code
- Better performance (no unnecessary re-renders)
- Simple API, easy to understand
- Built-in devtools support
- No provider wrapper needed

**Why not Redux?**
- Redux is overkill for this application's complexity
- Zustand provides same benefits with 1/10th the code

---

## 3. Directory Structure

```
/home/swd/RowLab/
├── docs/
│   └── PROJECT_DOCUMENTATION.md    ← You are here
├── data/
│   ├── athletes_template.csv       ← Example athlete data structure
│   ├── boats.csv                   ← Boat configurations (WORKING)
│   └── erg_data_template.csv       ← Example erg testing data structure
├── public/
│   └── images/
│       └── placeholder-avatar.svg  ← Fallback for missing headshots
├── src/
│   ├── components/
│   │   ├── BoatDisplay/           ← Boat visualization components
│   │   │   ├── BoatDisplay.jsx    (✅ Complete)
│   │   │   ├── Seat.jsx           (✅ Complete)
│   │   │   └── CoxswainSeat.jsx   (✅ Complete)
│   │   ├── AthleteBank/           ← Athlete roster components
│   │   │   ├── AthleteBank.jsx    (⚠️ Partially complete)
│   │   │   └── AthleteCard.jsx    (✅ Complete)
│   │   ├── Assignment/            ← Assignment and control components
│   │   │   ├── DragDropContext.jsx      (✅ Complete)
│   │   │   └── AssignmentControls.jsx   (✅ Complete)
│   │   ├── PerformanceView/       ← Performance data (SKELETON)
│   │   │   ├── PerformanceModal.jsx     (⚠️ Skeleton)
│   │   │   ├── ErgDataTable.jsx         (⚠️ Skeleton)
│   │   │   └── PerformanceChart.jsx     (⚠️ Skeleton)
│   │   └── RankingDisplay/        ← Ranking badges (SKELETON)
│   │       └── RankingBadge.jsx         (⚠️ Skeleton)
│   ├── utils/
│   │   ├── csvParser.js           ← CSV data loading (✅ Complete)
│   │   ├── boatConfig.js          ← Boat logic utilities (✅ Complete)
│   │   └── fileLoader.js          ← Headshot loading (✅ Complete)
│   ├── store/
│   │   └── lineupStore.js         ← Zustand state management (✅ Complete)
│   ├── App.jsx                    ← Main application (✅ Complete)
│   ├── App.css                    ← Global styles (✅ Complete)
│   └── index.jsx                  ← React entry point (✅ Complete)
├── server/
│   └── index.js                   ← Express server for headshots (✅ Complete)
├── config/
│   └── nginx-location.conf        ← Example nginx config
├── index.html                     ← HTML entry point
├── package.json                   ← Dependencies and scripts
├── vite.config.js                 ← Vite configuration
├── tailwind.config.js             ← Tailwind configuration
├── .gitignore
└── README.md
```

---

## 4. Data Schema & Sources

### 4.1 Athletes Data

#### Current Source: `LN_Country.csv`
- **Location:** `/home/swd/Rowing/LN_Country.csv`
- **Structure:**
  ```csv
  Last Name,Country Code
  Andersson,USA
  Barrett,USA
  ...
  ```
- **Status:** ✅ Available and in use
- **Records:** 53 athletes
- **Loading:** Loaded via `loadAthletes()` in `csvParser.js`

#### Full Schema (Template): `athletes_template.csv`
```csv
Country,LastName,FirstName,Port,Starboard,Sculling,IsCoxswain
USA,Smith,John,1,1,0,0
```

**Field Definitions:**
- `Country`: ISO 3166-1 alpha-3 code (USA, CAN, GBR, etc.)
- `LastName`: Athlete's last name (required)
- `FirstName`: Athlete's first name (optional, currently missing)
- `Port`: Boolean (1/0) - can row port side
- `Starboard`: Boolean (1/0) - can row starboard side
- `Sculling`: Boolean (1/0) - can scull
- `IsCoxswain`: Boolean (1/0) - is a coxswain

**Current Defaults:**
- `FirstName`: Empty string (display shows LastName only)
- `Port`: 1 (assume all can row port)
- `Starboard`: 1 (assume all can row starboard)
- `Sculling`: 0 (assume sweep rowing)
- `IsCoxswain`: 0 (assume rower)

**What's Missing:**
- First names for all athletes
- Actual Port/Starboard/Sculling capabilities
- Coxswain designations

**To Complete:**
1. Add FirstName column to LN_Country.csv or create new athletes.csv
2. Survey athletes for side preferences
3. Mark coxswains with IsCoxswain=1
4. Update `loadAthletes()` function to use new file path

---

### 4.2 Boat Configurations

#### Source: `boats.csv`
- **Location:** `/home/swd/RowLab/data/boats.csv`
- **Structure:**
  ```csv
  BoatName,NumSeats,HasCoxswain
  Varsity 8+,8,1
  JV 4-,4,0
  ```
- **Status:** ✅ Complete and working
- **Loading:** Loaded via `loadBoats()` in `csvParser.js`

**Field Definitions:**
- `BoatName`: Display name for the boat
- `NumSeats`: Number of rowing seats (1, 2, 4, 8)
- `HasCoxswain`: Boolean (1/0) - has coxswain position

**Seat Configuration Logic:**
- Automatically generated in `generateBoatConfig()`
- Odd seats (1, 3, 5, 7) = **Starboard**
- Even seats (2, 4, 6, 8) = **Port**
- Seat 1 = Bow (front), highest number = Stroke (back)
- Coxswain position rendered separately

---

### 4.3 Erg Testing Data (Template Only)

#### Source: `erg_data_template.csv`
- **Location:** `/home/swd/RowLab/data/erg_data_template.csv`
- **Structure:**
  ```csv
  LastName,FirstName,Date,TestType,Result,Split,StrokeRate,Watts
  Smith,John,2024-01-15,2k,06:28.5,01:37.1,32,385
  ```
- **Status:** ⚠️ Template only, no real data
- **Loading:** Loaded via `loadErgData()` but not displayed yet

**Field Definitions:**
- `LastName`, `FirstName`: Athlete identifier
- `Date`: Test date (YYYY-MM-DD)
- `TestType`: Type of test (2k, 6k, 500m, 30min, etc.)
- `Result`: Total time in MM:SS.s format
- `Split`: Average 500m split time
- `StrokeRate`: Average strokes per minute
- `Watts`: Average power output

**To Activate:**
1. Collect erg test data from athletes or coaching records
2. Populate erg_data.csv with real data
3. Uncomment performance view code in AthleteCard or BoatDisplay
4. Connect PerformanceModal to click events

---

### 4.4 Headshots

#### Source: Directory
- **Location:** `/home/swd/Rowing/Roster_Headshots_cropped/`
- **Naming Convention:** `LastName.jpg`, `LastName.jpeg`, or `LastName.png`
- **Examples:**
  - `Andersson.jpeg`
  - `Barrett.jpg`
  - `Brennan.png`
- **Status:** ✅ Available, 40+ headshots present
- **Fallback:** `placeholder-avatar.svg` used when headshot not found

**File Handling:**
- Server endpoint: `/api/headshots/:filename`
- Server tries extensions in order: `.jpg`, `.jpeg`, `.png`
- Frontend uses `getHeadshotUrl()` and `preloadImage()`
- Preloading happens on app load for better performance

**Specs:**
- Resolution: ~400x400px
- Format: JPEG, PNG
- Already cropped/standardized

---

## 5. Component Architecture

### 5.1 Core Components

#### **BoatDisplay** (`src/components/BoatDisplay/BoatDisplay.jsx`)
- **Purpose:** Main boat visualization component
- **Props:**
  - `boat`: Boat object with seats, coxswain, configuration
- **Status:** ✅ Complete
- **Features:**
  - Displays boat name and configuration
  - Shows completion status
  - Renders all seats in order (bow to stroke)
  - Remove boat button
  - Bow/Stroke direction indicator
  - Port/Starboard legend
- **Dependencies:** `Seat`, `CoxswainSeat`, `useLineupStore`
- **State Management:** Reads from and updates Zustand store

---

#### **Seat** (`src/components/BoatDisplay/Seat.jsx`)
- **Purpose:** Individual seat in a boat
- **Props:**
  - `boatId`: Parent boat ID
  - `seat`: Seat object (seatNumber, side, athlete)
  - `onSeatClick`: Click handler
- **Status:** ✅ Complete
- **Features:**
  - Droppable target for drag-and-drop
  - Displays seat number badge
  - Shows Port (P) or Starboard (S) indicator
  - Color-coded by side (red=Port, green=Starboard)
  - Shows athlete headshot if assigned
  - Visual feedback on hover, drag-over, selection
- **Dependencies:** `@dnd-kit/core`, `useLineupStore`

---

#### **CoxswainSeat** (`src/components/BoatDisplay/CoxswainSeat.jsx`)
- **Purpose:** Coxswain position display
- **Props:**
  - `boatId`: Parent boat ID
  - `coxswain`: Athlete object or null
  - `onCoxswainClick`: Click handler
- **Status:** ✅ Complete
- **Features:**
  - Same visual pattern as Seat but purple-themed
  - "C" badge instead of seat number
  - "COX" label
  - Droppable target
- **Dependencies:** `@dnd-kit/core`, `useLineupStore`

---

#### **AthleteBank** (`src/components/AthleteBank/AthleteBank.jsx`)
- **Purpose:** Display all athletes available for assignment
- **Props:** None (reads from store)
- **Status:** ⚠️ Partially Complete
  - ✅ Basic display with headshots
  - ✅ Search functionality
  - ✅ Assignment status tracking
  - ⚠️ Side filters (UI present, needs data)
  - ❌ Ranking display (needs system definition)
- **Features:**
  - Search by name
  - Filter by side capability (skeleton)
  - Shows available/assigned counts
  - Responsive grid layout
  - Instructions for users
- **Dependencies:** `AthleteCard`, `useLineupStore`, `getAssignedAthletes`
- **Future Work:**
  - Activate side filters when capability data available
  - Add ranking badges when system defined
  - Performance view integration (click athlete to view data)

---

#### **AthleteCard** (`src/components/AthleteBank/AthleteCard.jsx`)
- **Purpose:** Individual athlete display card
- **Props:**
  - `athlete`: Athlete object
  - `isAssigned`: Boolean assignment status
  - `onClick`: Click handler
- **Status:** ✅ Complete
- **Features:**
  - Draggable (via @dnd-kit)
  - Shows headshot
  - Displays LastName, FirstName (if available)
  - Country flag emoji
  - Visual states: normal, assigned, selected, dragging
  - Disabled when assigned
- **Dependencies:** `@dnd-kit/core`, `useLineupStore`, `getCountryFlag`
- **Future Work:**
  - Add ranking badge overlay when system ready

---

#### **AssignmentControls** (`src/components/Assignment/AssignmentControls.jsx`)
- **Purpose:** Control panel for workspace management
- **Props:** None (reads from store)
- **Status:** ✅ Complete
- **Features:**
  - Add boat buttons (dynamically generated from boat configs)
  - Shows current selection state (athlete or seats)
  - Swap athletes button (when 2 seats selected)
  - Save lineup to localStorage
  - Export lineup to JSON file
  - Clear selection buttons
  - Workspace statistics
- **Dependencies:** `useLineupStore`

---

#### **DragDropProvider** (`src/components/Assignment/DragDropContext.jsx`)
- **Purpose:** Provides drag-and-drop context for entire app
- **Props:**
  - `children`: React children to wrap
- **Status:** ✅ Complete
- **Features:**
  - Handles drag start/end/cancel events
  - Shows dragged athlete in overlay
  - Routes drops to correct seat/coxswain assignment
  - Pointer sensor with 8px activation distance (prevents accidental drags)
- **Dependencies:** `@dnd-kit/core`, `useLineupStore`, `AthleteCard`

---

### 5.2 Skeleton Components

#### **PerformanceModal** (`src/components/PerformanceView/PerformanceModal.jsx`)
- **Purpose:** Display athlete performance data in modal
- **Props:**
  - `athlete`: Athlete object
  - `onClose`: Close callback
  - `ergData`: Array of erg test results
- **Status:** ⚠️ Skeleton - UI complete, awaiting data
- **Features:**
  - Modal overlay with close button
  - "Data Pending" message when no erg data
  - Preview of what will be shown
  - ErgDataTable and PerformanceChart components ready
- **Dependencies:** `ErgDataTable`, `PerformanceChart`
- **Future Work:**
  - Connect to athlete click events in AthleteBank or Seat
  - Load erg data from CSV
  - Implement comparison mode (two athletes side-by-side)
- **Activation Steps:**
  1. Populate `erg_data.csv`
  2. Pass ergData from App.jsx to this component
  3. Add onClick handler to AthleteCard that opens this modal
  4. Test with real data

---

#### **ErgDataTable** (`src/components/PerformanceView/ErgDataTable.jsx`)
- **Purpose:** Tabular display of erg test results
- **Props:**
  - `data`: Array of test results
- **Status:** ⚠️ Skeleton - ready for data
- **Features:**
  - Table with columns: Date, TestType, Result, Split, StrokeRate, Watts
  - Sortable (future enhancement)
  - Responsive design
- **Future Work:**
  - Add sorting
  - Add filtering by test type
  - Highlight personal bests

---

#### **PerformanceChart** (`src/components/PerformanceView/PerformanceChart.jsx`)
- **Purpose:** Line chart showing performance trends
- **Props:**
  - `data`: Array of test results
- **Status:** ⚠️ Skeleton - Recharts integrated, needs data
- **Features:**
  - Line chart for watts over time
  - X-axis: Date
  - Y-axis: Watts (or split time)
  - Tooltip on hover
- **Dependencies:** `recharts`
- **Future Work:**
  - Toggle between metrics (watts, split, stroke rate)
  - Multiple lines for different test types
  - Trend line calculation

---

#### **RankingBadge** (`src/components/RankingDisplay/RankingBadge.jsx`)
- **Purpose:** Display athlete ranking badge
- **Props:**
  - `rank`: Number (1, 2, 3, ...)
  - `side`: Optional ('port', 'starboard', or null for overall)
  - `size`: 'sm', 'md', 'lg'
- **Status:** ⚠️ Skeleton - component ready, system undefined
- **Features:**
  - Color-coded by rank (gold, silver, bronze, blue)
  - Size variants
  - Side-specific icons (⚓ for port, ⭐ for starboard)
  - Tooltip with rank info
- **Blockers:**
  - **Ranking methodology not defined**
  - Need decision: manual entry or auto-calculated?
  - What metrics determine rank?
  - Overall rank, side-specific rank, or both?
- **Future Work:**
  - Define ranking system (see Section 14)
  - Add rank field to athlete data
  - Integrate into AthleteCard
  - Add admin interface for manual ranking updates (if manual)
  - Or implement auto-calculation from erg data (if automatic)

---

## 6. Feature Implementation Matrix

| Feature | Status | Data Required | Blocker | Est. Effort to Complete |
|---------|--------|---------------|---------|------------------------|
| Boat Display | ✅ Complete | boats.csv | None | N/A |
| Athlete Bank (basic) | ✅ Complete | LN_Country.csv | None | N/A |
| Headshot Loading | ✅ Complete | Image files | None | N/A |
| Click-to-Assign | ✅ Complete | None | None | N/A |
| Drag-and-Drop Assignment | ✅ Complete | None | None | N/A |
| Athlete Swapping | ✅ Complete | None | None | N/A |
| Add/Remove Boats | ✅ Complete | None | None | N/A |
| Save to localStorage | ✅ Complete | None | None | N/A |
| Export to JSON | ✅ Complete | None | None | N/A |
| Search Athletes | ✅ Complete | None | None | N/A |
| FirstName Display | ⚠️ Partial | FirstName in athlete CSV | Missing data | 30 min |
| Side Capability Filtering | ⚠️ Skeleton | Port/Starboard/Sculling flags | Missing data | 2-4 hours |
| Side Validation Warnings | ⚠️ Skeleton | Side capability data | Missing data | 2-3 hours |
| Performance View Modal | ⚠️ Skeleton | erg_data.csv + integration | Missing data + UI hookup | 6-8 hours |
| Erg Data Table | ⚠️ Skeleton | erg_data.csv | Missing data | 1-2 hours |
| Performance Charts | ⚠️ Skeleton | erg_data.csv | Missing data | 4-6 hours |
| Ranking System | ❌ Not Started | Ranking methodology | Undefined requirements | TBD (needs design) |
| Comparison Mode | ❌ Not Started | erg_data.csv | Missing data + design | 8-12 hours |
| Printable Lineup View | ❌ Not Started | None | Low priority | 4-6 hours |
| Undo/Redo | ❌ Not Started | None | Low priority | 6-8 hours |
| Database Persistence | ❌ Not Started | Backend + DB | Scope decision | 16-24 hours |

---

## 7. API Endpoints

The RowLab server provides a minimal REST API:

### `GET /api/headshots/:filename`

**Purpose:** Serve athlete headshot images

**Parameters:**
- `filename`: Athlete last name (with or without extension)

**Behavior:**
1. Removes extension from filename if present
2. Tries to find file with extensions: `.jpg`, `.jpeg`, `.png`
3. Returns first match found
4. Returns 404 if no match (frontend uses placeholder)

**Example Requests:**
```bash
GET /api/headshots/Smith
GET /api/headshots/Smith.jpg
GET /api/headshots/Anderson.png
```

**Response:**
- **Success (200):** Image file (binary)
- **Not Found (404):** `{"error": "Headshot not found"}`

**Authentication:** None (can be added via nginx)

---

### `GET /api/health`

**Purpose:** Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T12:34:56.789Z",
  "environment": "production"
}
```

---

### Production Static File Serving

In production mode (`NODE_ENV=production`), the server also serves:

- **React App:** `/` → `dist/index.html` (SPA)
- **Data Files:** `/data/*` → `data/` directory
- **Images:** `/images/*` → `public/images/` directory

---

## 8. File System Integration

### Headshot Loading Mechanism

**Server-Side (`server/index.js`):**
1. Receives request at `/api/headshots/:filename`
2. Looks in `/home/swd/Rowing/Roster_Headshots_cropped/`
3. Tries extensions: `.jpg`, `.jpeg`, `.png`
4. Serves file if found, 404 if not

**Client-Side (`utils/fileLoader.js`):**
1. `getHeadshotUrl(athlete)` constructs URL: `/api/headshots/${lastName}.jpg`
2. `preloadImage(src)` attempts to load image
3. If load fails, tries alternative extensions
4. Falls back to `/images/placeholder-avatar.svg`
5. `preloadHeadshots(athletes)` batch-loads all headshots on app start
6. Results stored in `headshotMap` (Map<athleteId, imageUrl>)

**Performance Optimization:**
- All headshots preloaded in parallel on app mount
- Map stored in Zustand state for instant access
- Prevents layout shift and loading flicker
- Failed loads cached with placeholder URL

**Path Resolution:**
- Absolute path on server: `/home/swd/Rowing/Roster_Headshots_cropped/`
- Relative URL on client: `/api/headshots/`
- Vite dev proxy forwards `/api/*` to `http://localhost:3002`

**Error Handling:**
- Missing files → placeholder image (no errors shown to user)
- Network errors → placeholder image
- Malformed filenames → 404 (graceful)

---

## 9. Data Flow Diagrams

### Athlete Assignment Flow
```
1. User clicks athlete in AthleteBank
   ↓
2. AthleteCard onClick → selectAthlete(athlete)
   ↓
3. Zustand store updates: selectedAthlete = athlete
   ↓
4. AssignmentControls shows "Athlete Selected" banner
   ↓
5. User clicks empty Seat in BoatDisplay
   ↓
6. Seat onClick → onSeatClick(seatNumber, false)
   ↓
7. BoatDisplay handleSeatClick checks: selectedAthlete exists?
   ↓ YES
8. assignToSeat(boatId, seatNumber, selectedAthlete)
   ↓
9. Zustand store:
   - Updates boat.seats[seatNumber].athlete = selectedAthlete
   - Clears selectedAthlete = null
   ↓
10. Components re-render:
    - AthleteBank: athlete now marked as assigned (grayed out)
    - BoatDisplay: seat now shows athlete headshot
    - AssignmentControls: banner disappears
```

### Drag-and-Drop Assignment Flow
```
1. User starts dragging AthleteCard
   ↓
2. DragDropProvider onDragStart → setActiveAthlete(athlete)
   ↓
3. DragOverlay shows dragged athlete card
   ↓
4. User drags over Seat (droppable target)
   ↓
5. Seat component: isOver = true (visual feedback)
   ↓
6. User releases mouse
   ↓
7. DragDropProvider onDragEnd:
   - active.data.current = { type: 'athlete', athlete }
   - over.data.current = { type: 'seat', boatId, seatNumber }
   ↓
8. assignToSeat(boatId, seatNumber, athlete)
   ↓
9. clearAthleteSelection()
   ↓
10. setActiveAthlete(null)
    ↓
11. Components re-render (same as click-to-assign)
```

### Athlete Swapping Flow
```
1. User clicks Seat with assigned athlete
   ↓
2. Seat onClick → onSeatClick(seatNumber, false)
   ↓
3. BoatDisplay handleSeatClick checks: selectedAthlete exists?
   ↓ NO (not in assignment mode)
4. toggleSeatSelection(boatId, seatNumber, false)
   ↓
5. Zustand store:
   - Adds { boatId, seatNumber, isCoxswain: false } to selectedSeats[]
   - If selectedSeats.length > 2, removes oldest selection
   ↓
6. Seat re-renders with yellow ring (isSelected = true)
   ↓
7. AssignmentControls shows "Seats Selected: 1/2"
   ↓
8. User clicks another Seat with assigned athlete
   ↓
9. Repeat steps 2-6
   ↓
10. AssignmentControls shows "Seats Selected: 2/2" + "Swap Athletes" button
    ↓
11. User clicks "Swap Athletes"
    ↓
12. swapAthletes():
    - Gets athlete1 from boat1.seats[seatNumber1]
    - Gets athlete2 from boat2.seats[seatNumber2]
    - Updates boat1.seats[seatNumber1].athlete = athlete2
    - Updates boat2.seats[seatNumber2].athlete = athlete1
    - Clears selectedSeats = []
    ↓
13. Components re-render:
    - Both seats show swapped athletes
    - Yellow rings disappear
    - Swap button disappears
```

### Data Loading on App Mount
```
1. App.jsx useEffect runs
   ↓
2. loadAthletes('/home/swd/Rowing/LN_Country.csv')
   ↓
3. parseCSV(filePath):
   - Fetches CSV via PapaParse
   - Normalizes headers (removes spaces)
   - Parses rows into objects
   ↓
4. loadAthletes transforms rows:
   - Extracts LastName, Country
   - Adds defaults for Port, Starboard, Sculling, IsCoxswain
   - Generates unique ID for each athlete
   ↓
5. setAthletes(athletesData) → Zustand store
   ↓
6. loadBoats('/data/boats.csv')
   ↓
7. parseCSV → setBoatConfigs(boatsData) → Zustand store
   ↓
8. preloadHeadshots(athletesData):
   - For each athlete, construct URL
   - Attempt to load image (try extensions)
   - Build Map<athleteId, imageUrl>
   ↓
9. setHeadshotMap(map) → Zustand store
   ↓
10. setLoading(false)
    ↓
11. App renders main UI
```

---

## 10. Configuration & Environment

### Environment Variables
Defined in `.env` (copy from `.env.example`):

```bash
PORT=3002              # Server port
NODE_ENV=development   # 'development' or 'production'
HEADSHOTS_PATH=/home/swd/Rowing/Roster_Headshots_cropped
ATHLETES_CSV=/home/swd/Rowing/LN_Country.csv
```

### Configuration Files

#### `package.json`
- Defines npm scripts and dependencies
- Key scripts:
  - `dev`: Vite dev server on port 3001
  - `build`: Production build
  - `server`: Run Express server
  - `start`: Production server (NODE_ENV=production)

#### `vite.config.js`
- Vite build tool configuration
- Dev server port: 3001
- Proxy `/api` to `http://localhost:3002`
- Build output: `dist/`

#### `tailwind.config.js`
- Tailwind CSS configuration
- Custom colors:
  - `rowing-blue`: #1e3a8a (primary brand color)
  - `rowing-gold`: #fbbf24 (accent)
  - `port`: #ef4444 (red for port side)
  - `starboard`: #22c55e (green for starboard side)

### nginx Configuration
- Location: `/etc/nginx/sites-available/your-domain`
- Example provided in `config/nginx-location.conf`
- Options:
  1. **Subdomain:** `rowlab.yourdomain.com` → proxy to port 3002
  2. **Subpath:** `/rowlab` location block → proxy to port 3002

**Recommended:** Subdomain approach for cleaner URLs

### Port Assignments
- **3001:** Vite dev server (development only)
- **3002:** Express API server (development and production)
- nginx proxies external traffic to 3002 in production

### File Paths (Absolute)
- Athlete CSV: `/home/swd/Rowing/LN_Country.csv`
- Headshots: `/home/swd/Rowing/Roster_Headshots_cropped/`
- Project root: `/home/swd/RowLab/`

---

## 11. Development Workflow

### Installation
```bash
cd /home/swd/RowLab
npm install
```

### Development (Two Terminal Windows)

**Terminal 1 - Frontend (Vite):**
```bash
npm run dev
```
- Starts Vite dev server on port 3001
- Hot module replacement enabled
- Open browser to `http://localhost:3001`

**Terminal 2 - Backend (Express):**
```bash
npm run server
```
- Starts Express server on port 3002
- Serves `/api/headshots` endpoint
- Vite proxy forwards API requests

### Build for Production
```bash
npm run build
```
- Compiles React app to `dist/`
- Minifies and optimizes
- Generates source maps

### Run Production Server
```bash
npm start
```
- Sets `NODE_ENV=production`
- Serves built React app from `dist/`
- Also serves API endpoints
- Single server on port 3002

### Development Tips
- Use React DevTools browser extension
- Use Zustand DevTools for state inspection
- Check browser console for CSV parsing logs
- Check server terminal for headshot loading logs

---

## 12. Testing Strategy

### Manual Testing Checklist

#### Core Functionality
- [ ] Load app successfully with all athletes displayed
- [ ] Search for athlete by last name
- [ ] Add boat to workspace (8+, 4+, 4-, etc.)
- [ ] Click athlete → click seat → athlete assigned
- [ ] Drag athlete → drop on seat → athlete assigned
- [ ] Click assigned seat → click another assigned seat → swap button appears
- [ ] Click swap button → athletes swap positions
- [ ] Remove athlete from seat → athlete returns to bank
- [ ] Remove boat from workspace → all athletes released
- [ ] Save lineup to localStorage
- [ ] Export lineup to JSON file
- [ ] Reload page → localStorage lineup persists (future feature)

#### Edge Cases
- [ ] Assign athlete to coxswain position
- [ ] Swap coxswain with seat athlete
- [ ] Swap athletes across different boats
- [ ] Multiple boats in workspace simultaneously
- [ ] All athletes assigned → bank shows "0 available"
- [ ] Search with no matches → "No athletes found" message
- [ ] Headshot missing → placeholder image displays
- [ ] CSV parsing error → error message displays

#### UI/UX
- [ ] Hover effects on seats and athlete cards
- [ ] Drag feedback (overlay shows dragged athlete)
- [ ] Drop target highlights when dragging over
- [ ] Selected seats show yellow ring
- [ ] Assigned athletes grayed out in bank
- [ ] Boat completion badge shows when full
- [ ] Port/Starboard colors correct (red/green)

#### Performance
- [ ] App loads in < 3 seconds
- [ ] Headshots load without flicker (preloading works)
- [ ] Dragging is smooth (no lag)
- [ ] No console errors

### Automated Testing (Future)
Currently no automated tests. Future implementation should include:
- **Unit tests:** Utilities (boatConfig, csvParser, fileLoader)
- **Integration tests:** Store actions and state updates
- **E2E tests:** Full user workflows (Playwright or Cypress)

### Browser Compatibility
Tested on:
- Chrome 120+ (primary)
- Firefox 120+ (should work)
- Safari 17+ (should work)
- Mobile browsers: Not optimized (desktop-first design)

---

## 13. Known Issues & Limitations

### Current Limitations
1. **No FirstName Data**
   - LN_Country.csv only has LastName
   - Athletes displayed by last name only
   - May cause confusion if duplicate last names exist

2. **No Side Capability Data**
   - All athletes assumed to row both Port and Starboard
   - Side filters in AthleteBank are placeholders
   - No warnings for side mismatches

3. **No Coxswain Identification**
   - All athletes assumed to be rowers
   - No auto-filtering of coxswains for coxswain seats

4. **No Erg Performance Data**
   - Performance view is skeleton only
   - Cannot evaluate athletes by test scores
   - No ranking system

5. **No Ranking System**
   - Cannot sort athletes by ability
   - No "best available" recommendations

6. **No Database Persistence**
   - Lineups saved to localStorage only
   - No multi-user support
   - No history or version control

7. **No Real-time Collaboration**
   - Single-user only
   - No WebSocket for live updates

8. **Desktop-Only Design**
   - Not responsive below 768px
   - Poor mobile experience

### Known Bugs
- **None reported** (initial development)

### Performance Considerations
- **Headshot Preloading:** May take 2-3 seconds on initial load (53 athletes × ~30KB each ≈ 1.5MB)
- **Large Rosters:** Performance tested with 53 athletes; may degrade with 200+
- **Multiple Boats:** No issues with 5-10 boats; not tested with 20+

### Browser Compatibility Issues
- **Safari:** Drag-and-drop may have slight visual differences
- **Firefox:** No known issues
- **IE11:** Not supported (uses modern ES6+)

---

## 14. Future Development Roadmap

### Immediate (Once Data Available)

#### 1. Integrate Full Athlete Data
**Blocker:** Need complete athletes.csv
- [ ] Add FirstName column to CSV
- [ ] Add Port/Starboard/Sculling capability flags
- [ ] Mark coxswains
- [ ] Update `loadAthletes()` to use new file
- [ ] Test side filtering
- [ ] Test side validation warnings

**Estimated Time:** 2-4 hours (once data ready)

#### 2. Activate Performance View
**Blocker:** Need erg_data.csv populated
- [ ] Collect erg test data
- [ ] Format into CSV
- [ ] Add click handler to AthleteCard to open PerformanceModal
- [ ] Pass erg data to modal
- [ ] Test charts and tables
- [ ] Add sorting and filtering

**Estimated Time:** 6-8 hours (once data ready)

### Short-Term

#### 3. Define and Implement Ranking System
**Blocker:** Need product decision on ranking methodology

**Decision Points:**
- **Manual or Automatic?**
  - Manual: Coach assigns ranks
  - Automatic: Calculate from erg data (2k time, watts, etc.)
  - Hybrid: Auto-calculate with manual overrides

- **Ranking Scope:**
  - Overall team ranking (1-53)
  - Side-specific (best port rowers, best starboard rowers)
  - Position-specific (best stroke seats, best bow seats)

- **Update Frequency:**
  - Static (updated seasonally)
  - Dynamic (recalculated after each erg test)

- **Display Location:**
  - Badge on athlete card
  - Separate rankings view
  - Sortable column in athlete bank

**Recommendation:** Automatic ranking based on 2k erg time (primary metric for most programs), with manual override capability.

**Implementation Steps:**
1. Define ranking algorithm (e.g., sort by 2k time ascending)
2. Add `rank`, `rankPort`, `rankStarboard` fields to athlete data
3. Calculate ranks in `loadAthletes()` or separate utility
4. Display RankingBadge in AthleteCard
5. Add rank sorting to AthleteBank

**Estimated Time:** 8-12 hours

#### 4. Printable Lineup View
- [ ] Create print-optimized CSS
- [ ] Add "Print" button to each boat
- [ ] Generate PDF-friendly layout
- [ ] Include boat name, date, lineup
- [ ] Hide UI controls in print view

**Estimated Time:** 4-6 hours

#### 5. Undo/Redo Functionality
- [ ] Implement history stack in Zustand store
- [ ] Track state changes (assignments, swaps, adds, removes)
- [ ] Add Undo/Redo buttons
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

**Estimated Time:** 6-8 hours

### Medium-Term

#### 6. Database Persistence
**Current:** localStorage only (browser-specific, no sharing)

**Proposed:**
- SQLite or PostgreSQL database
- Save lineups with timestamps and names
- Load previous lineups
- Version history
- Multi-user access (read-only for assistants?)

**Estimated Time:** 16-24 hours

#### 7. Comparison Mode
**Feature:** Compare two athletes side-by-side
- Erg test results
- Performance trends
- Side-by-side charts
- Highlight better performer

**Estimated Time:** 8-12 hours

#### 8. Mobile Responsive Design
**Current:** Desktop-first (768px+)

**Proposed:**
- Tablet optimization (768px-1024px)
- Mobile layout (320px-767px)
- Touch-friendly drag-and-drop
- Simplified UI for small screens

**Estimated Time:** 16-24 hours

### Long-Term

#### 9. Real-time Collaboration
- WebSocket server (Socket.io)
- Multiple coaches view same lineup
- Live updates when changes made
- Conflict resolution
- User presence indicators

**Estimated Time:** 40+ hours

#### 10. Advanced Features
- **Auto-lineup Suggestions:** AI/algorithm to suggest optimal lineups based on erg scores and side preferences
- **Race Simulation:** Predict boat speed based on athlete metrics
- **Historical Analysis:** Track lineup changes over season
- **Integration with Race Results:** Import race times, correlate with lineups
- **Export to Other Formats:** Excel, Google Sheets, PDF with formatting
- **Authentication & Authorization:** Login system, coach/athlete roles
- **Notifications:** Email/SMS when lineup posted

**Estimated Time:** Varies, 100+ hours total

---

## 15. Troubleshooting Guide

### Problem: Headshots not loading (showing placeholder)

**Possible Causes:**
1. Express server not running
2. Headshot file doesn't exist
3. File naming mismatch (e.g., "Smith" vs "smith")
4. Wrong file path in server

**Solutions:**
1. Check server is running: `npm run server`
2. Check server logs for 404 errors
3. Verify file exists: `ls /home/swd/Rowing/Roster_Headshots_cropped/ | grep Smith`
4. Check filename case sensitivity
5. Try accessing directly: `http://localhost:3002/api/headshots/Smith`
6. Check server/index.js has correct HEADSHOTS_PATH

---

### Problem: CSV parsing errors / No athletes displayed

**Possible Causes:**
1. CSV file path wrong
2. CSV format incorrect
3. Network error fetching CSV
4. Encoding issues (UTF-8 BOM, etc.)

**Solutions:**
1. Check browser console for errors
2. Verify CSV exists: `cat /home/swd/Rowing/LN_Country.csv | head`
3. Check CSV format (commas, no extra quotes)
4. Ensure CSV is UTF-8 encoded
5. Check `loadAthletes()` logs in console
6. Try loading CSV in online PapaParse tool to validate format

---

### Problem: Drag-and-drop not working

**Possible Causes:**
1. @dnd-kit not installed
2. DragDropProvider not wrapping components
3. Browser doesn't support drag-and-drop
4. Pointer sensor activation distance too high

**Solutions:**
1. Check `npm list @dnd-kit/core` shows installed
2. Verify App.jsx wraps content in `<DragDropProvider>`
3. Try different browser
4. Check console for React errors
5. Verify `useDraggable` and `useDroppable` hooks present in components

---

### Problem: Athletes not appearing after assignment

**Possible Causes:**
1. Store not updating
2. Component not re-rendering
3. Assignment logic bug

**Solutions:**
1. Check Zustand DevTools for state changes
2. Add `console.log` in `assignToSeat()` function
3. Verify boat ID and seat number are correct
4. Check `activeBoats` array in store

---

### Problem: Port 3001 or 3002 already in use

**Solutions:**
```bash
# Find process using port
lsof -i :3001
lsof -i :3002

# Kill process
kill -9 <PID>

# Or change port in package.json and vite.config.js
```

---

### Problem: Production build fails

**Possible Causes:**
1. npm dependencies missing
2. Build errors in code
3. Out of memory

**Solutions:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build with verbose logging
npm run build --verbose

# Check for syntax errors
npm run build 2>&1 | grep -i error
```

---

### Problem: nginx not proxying correctly

**Possible Causes:**
1. nginx config syntax error
2. Server not running
3. Port mismatch
4. Firewall blocking

**Solutions:**
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify server running
curl http://localhost:3002/api/health

# Check firewall
sudo ufw status
```

---

## 16. Contact & Maintenance

### Project Information
- **Project Name:** RowLab - Rowing Lineup Manager
- **Version:** 1.0.0
- **Created:** October 2025
- **License:** Private (specify if open-source)

### Maintainers
- **Primary Developer:** (Add name/contact)
- **Coach/Product Owner:** (Add name/contact)

### Reporting Issues
- For bugs or feature requests, document in issues log (create GitHub issues if open-sourced)
- For urgent issues, contact maintainer directly

### Documentation Updates
- Update this document whenever architecture changes
- Update version number and "Last Updated" date
- Document all new features and components

### Code Standards
- Follow existing code style (ESLint config can be added)
- Comment complex logic
- Update documentation for new features
- Test before committing

---

## Appendix A: Data Schema Reference

### Athlete Object Structure
```javascript
{
  id: "athlete-0",              // Generated unique ID
  lastName: "Smith",            // Required
  firstName: "John",            // Optional (currently empty)
  country: "USA",               // ISO 3166-1 alpha-3
  port: 1,                      // Boolean (1/0) - can row port
  starboard: 1,                 // Boolean (1/0) - can row starboard
  sculling: 0,                  // Boolean (1/0) - can scull
  isCoxswain: 0,                // Boolean (1/0) - is coxswain
}
```

### Boat Configuration Object
```javascript
{
  id: "boat-config-0",
  name: "Varsity 8+",
  numSeats: 8,
  hasCoxswain: true,
}
```

### Boat Instance Object
```javascript
{
  id: "boat-1729356123456",    // Timestamp-based ID
  name: "Varsity 8+",
  numSeats: 8,
  hasCoxswain: true,
  seats: [
    {
      seatNumber: 1,
      side: "Starboard",
      athlete: { ...athleteObject } or null
    },
    // ... 7 more seats
  ],
  coxswain: { ...athleteObject } or null
}
```

### Erg Test Result Object
```javascript
{
  id: "erg-0",
  lastName: "Smith",
  firstName: "John",
  date: "2024-01-15",          // YYYY-MM-DD
  testType: "2k",              // "2k", "6k", "500m", etc.
  result: "06:28.5",           // MM:SS.s
  split: "01:37.1",            // MM:SS.s per 500m
  strokeRate: 32,              // Strokes per minute
  watts: 385,                  // Power output
}
```

---

## Appendix B: Keyboard Shortcuts (Future)

Not yet implemented, but recommended:

- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Ctrl+S` / `Cmd+S`: Save lineup
- `Ctrl+P` / `Cmd+P`: Print lineup
- `Esc`: Clear selection / Close modal
- `/`: Focus search box
- `1-9`: Quick-add boat by index

---

## Appendix C: Color Scheme Reference

### Tailwind Custom Colors
```javascript
{
  'rowing-blue': '#1e3a8a',    // Primary brand color (dark blue)
  'rowing-gold': '#fbbf24',    // Accent color (gold)
  'port': '#ef4444',           // Port side indicator (red)
  'starboard': '#22c55e',      // Starboard side indicator (green)
}
```

### Semantic Colors
- **Assigned:** Blue (#3b82f6)
- **Selected:** Yellow ring (#eab308)
- **Coxswain:** Purple (#9333ea)
- **Complete:** Green badge (#22c55e)
- **Error:** Red (#dc2626)

---

## Changelog

### Version 1.0.0 (2025-10-19)
- Initial project setup
- Core functionality implemented
- Drag-and-drop assignment system
- Click-to-assign workflow
- Athlete swapping
- Boat workspace management
- Headshot loading with fallback
- CSV data loading
- localStorage save/export
- Skeleton components for future features
- Comprehensive documentation

---

**End of Documentation**

For questions or clarifications, refer to the troubleshooting guide or contact the project maintainer.
