# Feature Landscape: Rowing Team Management Software

**Domain:** Rowing team management and performance tracking
**Researched:** 2026-01-24
**Overall confidence:** MEDIUM (WebSearch verified with official sources where available)

## Executive Summary

Rowing team management software falls into three categories: **erg data platforms** (RowHero, Concept2 Logbook), **on-water tracking** (CrewNerd, GPS systems), and **team coordination** (Rowing Planner, RegattaCentral). Most existing tools are single-purpose; comprehensive platforms combining all features are rare.

Key insight: Coaches manage complexity through **manual workflows** (spreadsheets, messaging apps) because existing tools don't integrate lineup building, seat racing analysis, erg tracking, and periodization planning in one place. This creates opportunity for differentiation through **unified workflow**.

## Feature Analysis by Category

---

## 1. LINEUP BUILDER (Boat Assignments)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Boat roster creation** | Coaches need to assign athletes to boats before practice | Low | Simple CRUD with boat types (1x, 2x, 4+, 8+, etc.) |
| **Port/starboard assignment** | Sweep rowers have side preferences | Low | Binary choice per seat in sweep boats |
| **Athlete availability integration** | Can't assign unavailable athletes | Medium | Depends on existing availability tracking |
| **Boat type configurations** | Different boat classes have different seat counts | Low | Static data: 1x, 2-, 2+, 2x, 4-, 4+, 4x, 8+ |
| **Pre-practice communication** | Athletes need to know assignments before arriving | Low | Notification integration with existing system |
| **Session-specific lineups** | Different boats for different workouts | Low | Time-based boat assignments |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Drag-and-drop interface** | Faster lineup creation than form-based systems | Medium | No rowing-specific tools found with this UX |
| **Side preference tracking** | Auto-suggest port/starboard based on athlete history | Low | Extension of athlete profile data |
| **Medical info warnings** | Flag injured athletes during assignment | Medium | Requires medical/injury tracking integration |
| **Lineup history** | See past successful boat configurations | Medium | Archive and search previous lineups |
| **Weight class validation** | Auto-calculate boat average weight for lightweight categories | Low | Lightweight limit: 59kg women, 70kg men average |
| **Skill balance indicators** | Visual cues for balanced/imbalanced crews | High | Requires skill ratings or erg data integration |
| **Copy from previous session** | Reuse successful lineups | Low | Simple template functionality |
| **Multiple simultaneous lineups** | Plan A/B/C scenarios for different conditions | Medium | UI complexity for managing alternatives |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-generated "optimal" lineups** | Rowing lineup decisions involve nuanced factors (personality, technique compatibility, leadership) that algorithms can't capture | Provide data-driven suggestions, leave final decision to coach |
| **Real-time on-water tracking in lineup builder** | Scope creep; CrewNerd already does this well | Focus on pre-practice planning; integrate with external GPS tools later |
| **Complex constraint solvers** | Over-engineering; coaches don't want black-box optimization | Keep it simple: show data, let coaches decide |
| **Coxswain assignment automation** | Coxswain selection is highly strategic | Track coxswain roster, but manual assignment only |

**Sources:**
- [Rowing Planner](https://www.rowingplanner.com/) - boat allocation before sessions
- [Peach Innovations](http://www.peachinnovations.com/WebBoatConfiguration.htm) - port/starboard configuration
- [Ready all, row - Port vs Starboard](https://readyallrow.org/question-of-the-day-93/)

---

## 2. SEAT RACING (ELO-Based Athlete Ranking)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Race result entry** | Core data for seat racing calculations | Low | Boat A vs Boat B, winning margin in seconds |
| **Athlete swap tracking** | Must know who swapped between races | Low | Select athletes, record which boat they moved to |
| **Win margin calculation** | Traditional seat racing compares margin changes | Low | Time difference between consecutive races |
| **Side-specific rankings** | Port and stroke side ranked separately in sweep | Medium | Separate leaderboards for each side |
| **Pairs matrix support** | Common format: everyone rows with everyone | Medium | Combinatorial pairing algorithm |
| **Results history** | View all seat racing sessions over time | Low | Date-filtered race log |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **ELO-style ranking system** | More robust than simple win margins; accounts for strength of competition | High | Novel in rowing; requires mathematical model implementation |
| **Confidence intervals** | Show statistical significance of rankings | High | Bayesian approach or bootstrap methods |
| **Inferred comparisons** | If A beats B by 5s and A beats C by 3s, infer C beats B by 2s | Medium | Graph-based transitive calculations |
| **Fatigue modeling** | Account for athletes getting tired over multiple races | High | Time decay or race-order weighting |
| **Condition normalization** | Adjust for changing weather/water conditions | High | Requires environmental data input |
| **Visual race matrix** | Heatmap showing all athlete comparisons | Medium | D3.js or similar visualization library |
| **Export to lineup builder** | One-click seat assignment based on rankings | Medium | Integration between modules |
| **Multi-boat-class tracking** | Separate rankings for 4+ vs 8+ vs pairs | Medium | Category segmentation in ranking algorithm |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Fully automated crew selection** | Seat racing is "part of a big tapestry of information" - coaches consider erg scores, technique, leadership, boat feel | Provide rankings as input to manual decision |
| **Global cross-side ranking** | Mathematically impossible; port and stroke rankings are independent | Maintain separate leaderboards clearly labeled |
| **Real-time GPS-based seat racing** | Requires expensive hardware; out of scope | Manual time entry sufficient for MVP |
| **Machine learning predictions** | Overfitting; insufficient data in typical team | Statistical model adequate |

**Sources:**
- [British Rowing Plus - Seat Racing](https://plus.britishrowing.org/2024/01/02/seat-racing/) - methodology and best practices
- [The Data Science of Rowing Crew Selection](https://medium.com/@harry.powell72/the-data-science-of-rowing-crew-selection-16e5692cca79) - mathematical scoring model
- [row2k - Crew Selection Part 6](https://www.row2k.com/features/5486/crew-selection-part-6-seat-racing-protocol/) - protocols and procedures
- [GitHub - lindig/seat-racing](https://github.com/lindig/seat-racing) - algorithms discussion

---

## 3. ATHLETES PAGE (Roster Management)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Basic athlete profiles** | Name, contact, graduation year | Low | Standard CRUD |
| **Port/starboard preference** | Critical for lineup building | Low | Enum field: Port/Starboard/Both |
| **Weight tracking** | Required for lightweight categories | Low | Numeric field with date |
| **Squad/group assignment** | Teams organize by varsity/novice, gender | Low | Category tags |
| **Active/inactive status** | Alumni, injured, or inactive athletes | Low | Boolean or enum |
| **Bulk import** | Coaches don't want to manually enter 40+ athletes | Medium | CSV upload |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Medical info tracking** | Injuries, restrictions, allergies visible during lineup | Medium | Sensitive data; requires privacy controls |
| **Injury timeline** | Track injury history and return dates | Medium | Date range tracking with notes |
| **Performance snapshot** | Quick view of erg PRs, seat racing rank | Medium | Aggregate data from other modules |
| **Photo roster** | Visual recognition for new coaches | Low | Image upload and display |
| **Contact emergency info** | Parent/guardian contact for minors | Low | Additional contact fields |
| **Equipment assignments** | Track which oars, shoes, uniforms issued | Low | Simple item inventory per athlete |
| **Height tracking** | Rigging considerations; inseam for shoe size | Low | Numeric fields |
| **Erg handle height preference** | Personalized erg setup for testing | Low | Numeric field |
| **Multi-season history** | View athlete across multiple years | Medium | Archive old seasons, not delete |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Academic/GPA tracking** | Privacy concerns; out of scope | Let school systems handle this |
| **Payment/billing** | Complex regulatory requirements vary by organization | Integrate with existing payment tools or defer to v3 |
| **Detailed medical records** | Legal liability; needs HIPAA compliance | Track high-level injury status only |
| **Social features (profiles, feeds)** | Scope creep; not core coaching workflow | Activity feed already exists for training posts |

**Sources:**
- [Rowing Planner](https://www.rowingplanner.com/) - athlete info including medical and boat side preference
- [TeamSnap](https://www.teamsnap.com/teams) - general sports team roster management patterns
- [Sports Medicine - Rowing Injuries](https://www.sportsmed.org/membership/sports-medicine-update/summer-2024/injuries-in-rowing) - common injury types to track

---

## 4. ERG DATA TRACKING (Test Management & Trends)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Manual test entry** | Coaches need to log erg scores when Bluetooth unavailable | Low | Form: distance, time, split, watts |
| **Standard distances** | 2k, 6k, 30min, 60min are common benchmarks | Low | Preset distance options |
| **Personal records tracking** | Athletes want to see PRs automatically | Low | Query max performance per distance |
| **Team leaderboards** | Compare athletes within squad | Medium | Sortable table with filters (gender, weight class, boat class) |
| **Concept2 Logbook integration** | Athletes already log workouts there | High | API integration or CSV import |
| **Basic trend visualization** | Line chart of performance over time | Medium | Chart library (e.g., Recharts) |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Bluetooth PM5 live sync** | RowHero's killer feature; real-time data during tests | High | Requires PM5 Bluetooth protocol implementation |
| **Stroke-by-stroke analysis** | Identify consistency issues mid-piece | High | Requires live data stream from PM5 |
| **Heart rate zone tracking** | Monitor training intensity | Medium | Requires HR monitor integration |
| **Projected finish calculator** | Mid-test estimate of final time | Medium | Extrapolate from current split and distance remaining |
| **Interval workout parsing** | Track 8x500m or 4x2k with rest intervals | High | Structured workout format with segments |
| **Watts/split/pace conversions** | Multiple metric views for same workout | Low | Mathematical conversions (watts = 2.8 / split^3) |
| **Compare to previous tests** | Overlay current vs. past performance | Medium | Time-series comparison chart |
| **Age-adjusted rankings** | Compare masters rowers fairly | Medium | Concept2 age adjustment formula |
| **Export to Excel** | Coaches want spreadsheet analysis | Low | CSV download |
| **Force curve display** | Advanced technique analysis | High | Requires PM5 detailed metrics; complex visualization |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Replacing Concept2 Logbook** | Logbook is free, ubiquitous, has global rankings | Complement it; import from it |
| **On-water stroke data** | Requires GPS hardware; different problem domain | Stick to erg (indoor) data |
| **Workout prescription AI** | Complex; requires sport science expertise | Provide templates coaches can customize |
| **Video analysis** | Out of scope; separate tools exist (Dartfish) | Focus on numerical metrics |

**Sources:**
- [RowHero](https://rowhero.com/) - team erg data app with live tracking
- [Concept2 Logbook](https://log.concept2.com/) - industry standard erg tracking
- [ErgMonkey](https://ergmonkey.com/2025/02/how-heart-rate-zones-impact-personal-bests/) - heart rate zone analysis
- [Concept2 Erg Calculator](https://crewlab.io/resources/erg-calculator/) - conversion formulas

---

## 5. TRAINING PLANS (Periodization)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Calendar view** | See training schedule at a glance | Medium | Weekly/monthly calendar UI |
| **Workout assignment** | Assign workouts to specific dates | Low | Date-based task assignment |
| **Workout templates** | Reuse common workouts (steady state, intervals) | Medium | Template library with categories |
| **Phase definition** | Base, Race, Taper periods labeled | Low | Date range tags on calendar |
| **Notes/descriptions** | Context for each workout | Low | Text field per workout |
| **Athlete view** | Athletes see their assigned workouts | Low | Filtered calendar by athlete |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Periodization templates** | Pre-built 12-week or season-long plans | Medium | Research-backed training progressions |
| **Training load tracking** | Monitor volume accumulation (meters/week) | Medium | Aggregate distance across workouts |
| **Taper automation** | Suggest taper workouts based on race date | Medium | Volume reduction algorithm (7-14 days pre-race) |
| **Workout completion tracking** | Athletes mark workouts done | Low | Checkbox with date completed |
| **Heart rate zone prescriptions** | Assign specific HR zones per workout | Medium | Integrate with athlete HR max data |
| **Multi-phase planning** | Visualize entire season: base → build → race → recovery | Medium | Color-coded calendar regions |
| **Copy week/month templates** | Quickly duplicate training blocks | Low | Template cloning function |
| **Integration with erg data** | See if athlete hit prescribed splits | High | Compare workout plan vs. actual logged performance |
| **Coach notes/athlete feedback** | Two-way communication per workout | Medium | Comments thread per workout |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Automated plan generation** | Every team has unique goals, constraints, travel schedules | Provide templates coaches customize manually |
| **RPE/readiness tracking** | Athletes won't reliably log subjective metrics | Optional if implemented; don't depend on it |
| **Nutrition planning** | Out of scope; specialized domain | Defer to nutritionists or separate tools |
| **Strength training programs** | Rowing-specific S&C is complex; different expertise | Focus on rowing/erg workouts only |

**Sources:**
- [Coach Bergenroth - Rowing Periodization](https://www.coachbergenroth.com/rowing-periodization-spreadsheet-planning-a-rowing-season/) - season planning spreadsheet
- [Rowing Stronger - Periodization](https://rowingstronger.com/2018/02/19/strength-training-for-masters-rowers-periodization/) - phase structure
- [TrainingPeaks](https://www.trainingpeaks.com/training-plans/rowing) - general endurance periodization platform
- [ErgMonkey - Taper for 2k](https://ergmonkey.com/2025/03/how-to-taper-for-a-2k-erg-test/) - taper strategies

---

## 6. RACING/REGATTAS (Results, Rankings)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Regatta list** | Upcoming races with dates/locations | Low | Event CRUD |
| **Entry management** | Which boats/athletes entering which events | Medium | Many-to-many: athletes → boats → events |
| **Results entry** | Final times, placements per event | Low | Form with time and place |
| **Heat/final structure** | Prelims, semifinals, finals progression | Medium | Multi-round event structure |
| **Team results summary** | Aggregate performance across all events | Medium | Rollup of event results |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **RegattaCentral integration** | Import entries/results from RC API | High | API integration with RegattaCentral |
| **Margin calculation** | Time behind winner/leader | Low | Arithmetic on finish times |
| **Points system** | Automatic team scoring (NCAA, IRA formats) | Medium | Configurable scoring rules |
| **Historical comparisons** | Compare this year vs. last year at same regatta | Medium | Year-over-year data queries |
| **Split tracking** | 500m splits through race course | High | Requires timing system integration or manual entry |
| **Margin visualization** | See distance between boats at finish | Medium | Chart showing relative positions |
| **Fastest times across years** | All-time bests at specific venues | Medium | Historical leaderboard |
| **Weather/conditions notes** | Context for results (wind, current) | Low | Text fields per race |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Live race timing system** | Expensive hardware; regatta organizer responsibility | Import results after the fact |
| **Regatta organization tools** | RegattaCentral, RaceLeader do this well; different user (organizer vs. team) | Focus on team perspective: entries, results, analysis |
| **Broadcast graphics** | Completely different domain; TV production tools | Track results data only |
| **Travel logistics** | Hotels, buses, meal planning out of scope | Defer to separate systems or manual management |

**Sources:**
- [RegattaCentral](https://www.regattacentral.com/) - industry leader in regatta management
- [row2k Results](https://www.row2k.com/results/) - 2026 regatta results archive
- [Regatta Master](https://regattamaster.com/) - regatta organizer tools

---

## 7. BOAT MARGIN VISUALIZER (Distance on Pieces)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Time-based margin display** | Show seconds behind leader | Low | Arithmetic on finish times |
| **Position list** | 1st, 2nd, 3rd with boat names and times | Low | Sorted result table |
| **Multiple boat comparison** | More than just two boats | Low | Scalable to N boats |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Distance conversion** | Convert time margin to meters behind | Medium | Distance = margin × average_speed |
| **Visual boat positions** | Side-by-side bars or track showing relative positions | Medium | SVG/canvas graphic |
| **Split-by-split progression** | Animate or chart position changes through race | High | Requires split data at multiple points |
| **Projected finish calculator** | Mid-race estimate of final margins | Medium | Extrapolate from current splits |
| **Color-coded boats** | Visual distinction for own boats vs. competitors | Low | CSS styling based on ownership |
| **Exportable graphics** | Download visualization for presentations | Medium | SVG export or screenshot functionality |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **GPS live tracking** | Requires hardware on boats; expensive | Work with post-race data |
| **3D animations** | Overkill; 2D sufficient for understanding | Simple bar charts or lane diagrams |
| **Integration with broadcast systems** | Different user; out of scope | Focus on coaching analysis, not spectator entertainment |

**Sources:**
- [Scullr GPS](http://scullr.com/) - race mode with virtual timing gates
- [GEORACING](https://www.georacing.com/sports-rowing/) - GPS tracking for rowing events
- [Target Splits](https://targetsplits.com/) - pace planning visualization

---

## Feature Dependencies

```
Erg Data Tracking
    ↓
Athletes Page (needs erg PR data for profiles)
    ↓
Lineup Builder (needs athlete roster, side preference, erg performance)
    ↓
Seat Racing (needs lineups to define race configurations)

Training Plans
    ↓
Erg Data Tracking (workouts assigned → workouts completed)

Racing/Regattas
    ↓
Lineup Builder (entries need boat configurations)
    ↓
Boat Margin Visualizer (needs race results)
```

---

## MVP Recommendation

For v2.0 milestone, prioritize features in this order:

### Phase 1 (Foundation)
1. **Athletes Page** - roster must exist before lineups
2. **Erg Data Tracking (manual entry)** - core performance data

### Phase 2 (Lineup Workflows)
3. **Lineup Builder** - highest coaching value; daily use
4. **Training Plans** - assign workouts to athletes

### Phase 3 (Advanced Analysis)
5. **Seat Racing** - selection season-specific; less frequent use
6. **Racing/Regattas** - seasonal, not daily workflow

### Defer to Post-v2.0
- **Boat Margin Visualizer**: Nice-to-have; low priority vs. core workflows
- **Bluetooth PM5 sync**: High complexity; manual entry sufficient for MVP
- **RegattaCentral API integration**: External dependency; manual entry acceptable initially

---

## Confidence Assessment

| Feature Category | Confidence | Source Quality |
|------------------|------------|----------------|
| Lineup Builder | MEDIUM | WebSearch + Rowing Planner official docs |
| Seat Racing | HIGH | British Rowing official + academic research |
| Athletes Page | HIGH | Multiple sports management platforms |
| Erg Data Tracking | HIGH | RowHero + Concept2 official documentation |
| Training Plans | MEDIUM | Coaching blogs + general periodization literature |
| Racing/Regattas | MEDIUM | RegattaCentral + row2k (industry standards) |
| Boat Margin Visualizer | LOW | Limited rowing-specific tools; extrapolated from GPS tracking systems |

---

## Open Questions for Phase-Specific Research

- **Lineup Builder**: What's the UX pattern for coxswain assignment? (Ninth seat in 8+, separate from rower seats?)
- **Seat Racing**: Should ELO implementation use fixed K-factor or adaptive based on race count?
- **Erg Data**: Can we access PM5 Bluetooth protocol documentation, or is it proprietary?
- **Training Plans**: How do coaches handle multi-squad planning (Varsity vs. Novice different workouts)?
- **Racing**: What are NCAA, IRA, ACRA scoring systems exactly? (Need specific point formulas)

---

## Sources

### Primary Research
- [RowHero](https://rowhero.com/) - team erg data tracking
- [Rowing Planner](https://www.rowingplanner.com/) - boat allocation and attendance
- [Concept2 Logbook](https://log.concept2.com/) - erg workout tracking and rankings
- [British Rowing Plus - Seat Racing](https://plus.britishrowing.org/2024/01/02/seat-racing/)
- [RegattaCentral](https://www.regattacentral.com/) - regatta management
- [CrewNerd](https://apps.apple.com/gb/app/crewnerd-for-rowing-paddling/id307935199) - on-water GPS tracking

### Academic/Technical
- [The Data Science of Rowing Crew Selection](https://medium.com/@harry.powell72/the-data-science-of-rowing-crew-selection-16e5692cca79)
- [GitHub - lindig/seat-racing](https://github.com/lindig/seat-racing) - mathematical methods

### Coaching Resources
- [Coach Bergenroth](https://www.coachbergenroth.com/) - periodization, seat racing, erg training
- [Rowing Stronger](https://rowingstronger.com/) - strength training periodization
- [row2k](https://www.row2k.com/) - crew selection series, regatta results

### Sports Team Management (General Patterns)
- [TeamSnap](https://www.teamsnap.com/teams)
- [Connecteam](https://connecteam.com/best-sports-team-management-apps/)
- [Jersey Watch - Sports Team Management Apps](https://www.jerseywatch.com/blog/best-sports-team-management-software)
