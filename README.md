# RowLab - Rowing Lineup Manager

> Web application for rowing coaches to create and manage boat lineups

---

## Project Summary

<!-- LINKEDIN COPY-PASTE START -->

A web-based lineup management tool designed for rowing coaches to optimize boat assignments and visualize team configurations. The application enables coaches to drag-and-drop athletes into various boat types, manage roster data from CSV imports, and experiment with different lineup combinations in real-time. Includes a machine learning roadmap for predictive analytics and performance optimization.

**Key Technical Achievements:**
- Designed an intuitive drag-and-drop interface for seat assignments across multiple boat configurations (1x through 8+)
- Implemented a modern "Liquid Glass" design system with glassmorphism effects and responsive layouts
- Built a Node.js/Express backend API for athlete data management and lineup persistence
- Created both compact and expanded visualization modes for lineup comparison
- Integrated athlete headshot display and country flag indicators for international rosters

**Machine Learning Roadmap:**
- Athlete ranking algorithm using aggregated performance data and erg score analysis
- True relative speed calculations adjusting for seat position, boat class, and conditions
- Predictive placement modeling against competing schools based on historical race data
- AI-driven training suggestions based on individual athlete metrics and team goals
- PostgreSQL database integration for longitudinal athlete data storage and analysis

**Technologies:** Node.js, Express, React, Vite, TailwindCSS, Zustand, dnd-kit | *Planned: Python, Scikit-learn, PostgreSQL*

<!-- LINKEDIN COPY-PASTE END -->

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Access to athlete CSV file: `/home/swd/Rowing/LN_Country.csv`
- Access to headshots directory: `/home/swd/Rowing/Roster_Headshots_cropped/`

### Installation

```bash
cd /home/swd/RowLab
npm install
```

### Development

**Option 1: Single command (recommended):**
```bash
npm run dev:full
```
Runs both frontend (port 3001) and backend (port 3002) simultaneously.

**Option 2: tmux session (persistent):**
```bash
npm run dev:tmux
```
Creates a persistent tmux session with 3 windows (backend, frontend, shell).

**Option 3: Run separately (two terminal windows):**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run server
```

**Stop all development servers:**
```bash
npm stop
```
Kills all RowLab dev servers (works for both concurrently and tmux modes).

Open browser to `http://localhost:3001`

### Production

Build and run:
```bash
npm run build
npm start
```
Server runs on port 3002

## Features

### ✅ Fully Functional
- **Visual Boat Builder**: Add multiple boats to workspace (8+, 4+, 4-, etc.)
- **Athlete Management**: View all athletes with headshots and country flags
- **Click-to-Assign**: Click athlete → click seat → assignment
- **Drag-and-Drop**: Drag athletes directly onto seats
- **Athlete Swapping**: Click two seats to swap athletes (within or across boats)
- **Search & Filter**: Find athletes quickly by name
- **Save & Export**: Save lineups to localStorage or export as JSON
- **Real Data**: Loads 53 athletes from existing CSV

### ⚠️ Coming Soon (Awaiting Data)
- **Performance Metrics**: View erg test results and trends (needs erg_data.csv)
- **Side Validation**: Warnings for port/starboard mismatches (needs capability data)
- **Ranking System**: Display athlete rankings (needs methodology definition)

## Usage

### Creating a Lineup

1. **Add a boat** from the controls panel (e.g., "Varsity 8+")
2. **Select an athlete** from the roster (click or drag)
3. **Assign to seat**:
   - Click method: Click athlete, then click empty seat
   - Drag method: Drag athlete card onto seat
4. **Repeat** until all seats filled

### Swapping Athletes

1. Click an athlete in an assigned seat (yellow ring appears)
2. Click another assigned seat (shows "Seats Selected: 2/2")
3. Click "Swap Athletes" button in controls panel

### Saving Lineups

- **Save to Browser**: Click "Save Lineup" (persists in localStorage)
- **Export**: Click "Export JSON" to download file

## Project Structure

```
/home/swd/RowLab/
├── src/                    # React source code
│   ├── components/         # React components
│   ├── utils/              # Utilities (CSV, boat config, etc.)
│   └── store/              # Zustand state management
├── server/                 # Express API server
├── data/                   # CSV data files
├── docs/                   # Full documentation
└── public/                 # Static assets
```

## Data Files

### Athletes: `LN_Country.csv`
- **Location**: `/home/swd/Rowing/LN_Country.csv`
- **Contains**: LastName, Country (53 athletes)
- **Loaded**: Automatically on app start

### Boat Configs: `boats.csv`
- **Location**: `data/boats.csv`
- **Contains**: Boat definitions (Varsity 8+, JV 4-, etc.)
- **Status**: ✅ Complete

### Headshots
- **Location**: `/home/swd/Rowing/Roster_Headshots_cropped/`
- **Naming**: `LastName.jpg` (or `.jpeg`, `.png`)
- **Fallback**: Placeholder avatar if not found

## Technical Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Drag-and-Drop**: @dnd-kit
- **State**: Zustand
- **CSV Parsing**: PapaParse
- **Backend**: Express.js (Node.js)
- **Charts**: Recharts (for future erg data)

## Scripts

### Development
- `npm run dev:full` - **Start both servers** (recommended, uses concurrently)
- `npm run dev:tmux` - **Start in tmux session** (persistent, detachable)
- `npm stop` - **Stop all development servers** (both concurrently and tmux)
- `npm run dev` - Start Vite dev server only (port 3001)
- `npm run server` - Start Express API server only (port 3002)

### Production
- `npm run build` - Build for production
- `npm start` - Run production server (port 3002)

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and customize:

```bash
PORT=3002
NODE_ENV=development
HEADSHOTS_PATH=/home/swd/Rowing/Roster_Headshots_cropped
ATHLETES_CSV=/home/swd/Rowing/LN_Country.csv
```

### nginx Deployment
See `config/nginx-location.conf` for example nginx configuration.

**Subdomain option (recommended):**
```nginx
server {
    listen 443 ssl http2;
    server_name rowlab.yourdomain.com;

    location / {
        proxy_pass http://localhost:3002;
        # ... proxy headers
    }
}
```

**Subpath option:**
```nginx
location /rowlab {
    proxy_pass http://localhost:3002;
    # ... proxy headers
}
```

## Documentation

📚 **Full documentation**: [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)

Includes:
- Complete component architecture
- Data flow diagrams
- Feature implementation matrix
- Troubleshooting guide
- Future development roadmap

## Troubleshooting

### Headshots not loading?
1. Check Express server is running (`npm run server`)
2. Verify headshots exist: `ls /home/swd/Rowing/Roster_Headshots_cropped/`
3. Check server logs for 404 errors
4. Test endpoint: `curl http://localhost:3002/api/headshots/Smith`

### No athletes showing?
1. Check browser console for errors
2. Verify CSV exists: `cat /home/swd/Rowing/LN_Country.csv`
3. Check CSV format (commas, no extra quotes)

### Drag-and-drop not working?
1. Verify @dnd-kit installed: `npm list @dnd-kit/core`
2. Try different browser
3. Check console for React errors

### Port already in use?
```bash
# Find and kill process
lsof -i :3001
kill -9 <PID>
```

## Future Enhancements

### Immediate (Once Data Available)
- Integrate full athlete data (FirstName, Port/Starboard capabilities)
- Activate performance view (needs erg_data.csv)
- Implement side validation warnings

### Short-Term
- Define and implement ranking system
- Add printable lineup view
- Undo/Redo functionality

### Long-Term
- Database persistence (PostgreSQL)
- Real-time collaboration (WebSocket)
- Mobile responsive design
- Auto-lineup suggestions (AI)

---

## Machine Learning Roadmap

### Athlete Performance Analytics
| Feature | Description | Status |
|---------|-------------|--------|
| **Erg Score Analysis** | Import and analyze 2k, 6k, and other erg test results with trend visualization | Planned |
| **Athlete Ranking Algorithm** | Aggregate performance metrics to generate dynamic power rankings | Planned |
| **True Relative Speed** | Calculate adjusted speed accounting for seat position, boat class, and weather conditions | Planned |

### Predictive Modeling
| Feature | Description | Status |
|---------|-------------|--------|
| **Race Placement Prediction** | ML model to predict placement against competing schools using historical race data | Planned |
| **Optimal Lineup Suggestions** | AI-driven recommendations for boat compositions based on athlete compatibility | Planned |
| **Training Recommendations** | Personalized training suggestions based on individual metrics and team goals | Planned |

### Data Infrastructure
| Feature | Description | Status |
|---------|-------------|--------|
| **PostgreSQL Database** | Persistent storage for athlete data, lineups, and historical performance | Planned |
| **Data Import Pipeline** | Automated ingestion from erg machines, race results, and training logs | Planned |
| **Analytics Dashboard** | Visual reporting on team trends, individual progress, and competitive analysis | Planned |

### Technologies (Planned)
- **ML/Analytics**: Python, Scikit-learn, Pandas, NumPy
- **Database**: PostgreSQL with Prisma ORM
- **Visualization**: Recharts, D3.js

See [PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) for detailed roadmap.

## License

Private - (Specify license if open-sourcing)

## Contact

- **Issues**: Document bugs and feature requests
- **Questions**: Contact project maintainer

---

**RowLab v1.0** - Built with React, Vite, and ❤️ for rowing coaches
