/**
 * Query Key Factories for TanStack Query
 *
 * Hierarchical query key structure for type-safe cache management.
 * Each domain follows the pattern: all -> lists -> list(filters) -> details -> detail(id)
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    teams: () => [...queryKeys.auth.all, 'teams'] as const,
  },

  // Athletes
  athletes: {
    all: ['athletes'] as const,
    lists: () => [...queryKeys.athletes.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.athletes.lists(), { filters }] as const,
    details: () => [...queryKeys.athletes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.athletes.details(), id] as const,
    count: (teamId: string) => [...queryKeys.athletes.all, 'count', teamId] as const,
  },

  // Erg Tests
  ergTests: {
    all: ['ergTests'] as const,
    lists: () => [...queryKeys.ergTests.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.ergTests.lists(), { filters }] as const,
    details: () => [...queryKeys.ergTests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.ergTests.details(), id] as const,
    leaderboard: (filters?: Record<string, unknown>) =>
      [...queryKeys.ergTests.all, 'leaderboard', { filters }] as const,
  },

  // Lineups
  lineups: {
    all: ['lineups'] as const,
    lists: () => [...queryKeys.lineups.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.lineups.lists(), { filters }] as const,
    details: () => [...queryKeys.lineups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.lineups.details(), id] as const,
    draft: (id: string) => [...queryKeys.lineups.all, 'draft', id] as const,
  },

  // Shells
  shells: {
    all: ['shells'] as const,
    list: () => [...queryKeys.shells.all, 'list'] as const,
  },

  // Boat Configs
  boatConfigs: {
    all: ['boatConfigs'] as const,
    list: () => [...queryKeys.boatConfigs.all, 'list'] as const,
  },

  // Oar Sets
  oarSets: {
    all: ['oarSets'] as const,
    list: () => [...queryKeys.oarSets.all, 'list'] as const,
  },

  // Seat Races
  seatRaces: {
    all: ['seatRaces'] as const,
    lists: () => [...queryKeys.seatRaces.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.seatRaces.lists(), { filters }] as const,
    details: () => [...queryKeys.seatRaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.seatRaces.details(), id] as const,
  },

  // Ratings
  ratings: {
    all: ['ratings'] as const,
    rankings: (side?: string) => [...queryKeys.ratings.all, 'rankings', { side }] as const,
    parameters: () => [...queryKeys.ratings.all, 'parameters'] as const,
    athlete: (id: string) => [...queryKeys.ratings.all, 'athlete', id] as const,
  },

  // Advanced Rankings
  advancedRankings: {
    all: ['advancedRankings'] as const,
    bradleyTerry: () => [...queryKeys.advancedRankings.all, 'bradleyTerry'] as const,
    composite: (filters?: Record<string, unknown>) =>
      [...queryKeys.advancedRankings.all, 'composite', { filters }] as const,
    matrix: () => [...queryKeys.advancedRankings.all, 'matrix'] as const,
  },

  // Training Plans
  trainingPlans: {
    all: ['trainingPlans'] as const,
    lists: () => [...queryKeys.trainingPlans.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.trainingPlans.lists(), { filters }] as const,
    details: () => [...queryKeys.trainingPlans.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.trainingPlans.details(), id] as const,
    workouts: (planId: string) => [...queryKeys.trainingPlans.all, 'workouts', planId] as const,
  },

  // Sessions
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.sessions.lists(), { filters }] as const,
    details: () => [...queryKeys.sessions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
    live: (id: string) => [...queryKeys.sessions.all, 'live', id] as const,
    count: (teamId: string) => [...queryKeys.sessions.all, 'count', teamId] as const,
    active: () => [...queryKeys.sessions.all, 'active'] as const,
    upcoming: (days: number) => [...queryKeys.sessions.all, 'upcoming', days] as const,
  },

  // Regattas
  regattas: {
    all: ['regattas'] as const,
    lists: () => [...queryKeys.regattas.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.regattas.lists(), { filters }] as const,
    details: () => [...queryKeys.regattas.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.regattas.details(), id] as const,
  },

  // Races
  races: {
    all: ['races'] as const,
    list: (regattaId: string) => [...queryKeys.races.all, 'list', regattaId] as const,
    detail: (id: string) => [...queryKeys.races.all, 'detail', id] as const,
  },

  // Race Day (live WebSocket updates)
  raceday: {
    all: ['raceday'] as const,
    viewers: (regattaId: string) => [...queryKeys.raceday.all, 'viewers', regattaId] as const,
    liveResults: (regattaId: string) =>
      [...queryKeys.raceday.all, 'liveResults', regattaId] as const,
  },

  // Attendance
  attendance: {
    all: ['attendance'] as const,
    date: (date: string) => [...queryKeys.attendance.all, 'date', date] as const,
    athlete: (id: string) => [...queryKeys.attendance.all, 'athlete', id] as const,
    summary: (filters?: Record<string, unknown>) =>
      [...queryKeys.attendance.all, 'summary', { filters }] as const,
  },

  // Availability
  availability: {
    all: ['availability'] as const,
    team: (filters?: Record<string, unknown>) =>
      [...queryKeys.availability.all, 'team', { filters }] as const,
    athlete: (id: string) => [...queryKeys.availability.all, 'athlete', id] as const,
  },

  // NCAA Compliance
  ncaaCompliance: {
    all: ['ncaaCompliance'] as const,
    weekly: (filters?: Record<string, unknown>) =>
      [...queryKeys.ncaaCompliance.all, 'weekly', { filters }] as const,
    daily: (filters?: Record<string, unknown>) =>
      [...queryKeys.ncaaCompliance.all, 'daily', { filters }] as const,
  },

  // Whiteboard
  whiteboard: {
    all: ['whiteboard'] as const,
    latest: () => [...queryKeys.whiteboard.all, 'latest'] as const,
    detail: (id: string) => [...queryKeys.whiteboard.all, 'detail', id] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    preferences: () => [...queryKeys.dashboard.all, 'preferences'] as const,
    activityFeed: () => [...queryKeys.dashboard.all, 'activityFeed'] as const,
    layout: (userId: string) => [...queryKeys.dashboard.all, 'layout', userId] as const,
    exceptions: (teamId: string) => [...queryKeys.dashboard.all, 'exceptions', teamId] as const,
    teamData: (teamId: string, athleteId: string) =>
      [...queryKeys.dashboard.all, 'teamData', teamId, athleteId] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    user: () => [...queryKeys.settings.all, 'user'] as const,
    team: () => [...queryKeys.settings.all, 'team'] as const,
    integrations: () => [...queryKeys.settings.all, 'integrations'] as const,
    subscription: () => [...queryKeys.settings.all, 'subscription'] as const,
  },

  // Achievements
  achievements: {
    all: ['achievements'] as const,
    list: () => [...queryKeys.achievements.all, 'list'] as const,
    athlete: (id: string) => [...queryKeys.achievements.all, 'athlete', id] as const,
    pinned: (athleteId: string) => [...queryKeys.achievements.all, 'pinned', athleteId] as const,
    definitions: () => [...queryKeys.achievements.all, 'definitions'] as const,
  },

  // Personal Records
  personalRecords: {
    all: ['personalRecords'] as const,
    mine: () => [...queryKeys.personalRecords.all, 'mine'] as const,
    athlete: (id: string) => [...queryKeys.personalRecords.all, 'athlete', id] as const,
    ranks: () => [...queryKeys.personalRecords.all, 'ranks'] as const,
    teamRecords: () => [...queryKeys.personalRecords.all, 'teamRecords'] as const,
    celebration: (testId: string) =>
      [...queryKeys.personalRecords.all, 'celebration', testId] as const,
    trend: (athleteId: string, testType: string) =>
      [...queryKeys.personalRecords.all, 'trend', athleteId, testType] as const,
  },

  // Challenges
  challenges: {
    all: ['challenges'] as const,
    lists: () => [...queryKeys.challenges.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.challenges.all, 'list', status] as const,
    detail: (id: string) => [...queryKeys.challenges.all, 'detail', id] as const,
    leaderboard: (id: string) => [...queryKeys.challenges.all, 'leaderboard', id] as const,
    active: () => [...queryKeys.challenges.all, 'active'] as const,
    templates: () => [...queryKeys.challenges.all, 'templates'] as const,
  },

  // Streaks
  streaks: {
    all: ['streaks'] as const,
    mine: () => [...queryKeys.streaks.all, 'mine'] as const,
    config: () => [...queryKeys.streaks.all, 'config'] as const,
    athlete: (id: string) => [...queryKeys.streaks.all, 'athlete', id] as const,
  },

  // Seasons
  seasons: {
    all: ['seasons'] as const,
    milestones: (startDate?: string, endDate?: string) =>
      [...queryKeys.seasons.all, 'milestones', { startDate, endDate }] as const,
  },

  // Recruit Visits
  recruitVisits: {
    all: ['recruitVisits'] as const,
    lists: () => [...queryKeys.recruitVisits.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.recruitVisits.all, 'list', { filters }] as const,
    detail: (id: string) => [...queryKeys.recruitVisits.all, 'detail', id] as const,
    upcoming: () => [...queryKeys.recruitVisits.all, 'upcoming'] as const,
    byHost: (athleteId: string) => [...queryKeys.recruitVisits.all, 'byHost', athleteId] as const,
  },

  // Singular alias used by useRecruitVisits hook
  get recruitVisit() {
    return queryKeys.recruitVisits;
  },

  // Checklists
  checklists: {
    all: ['checklists'] as const,
    regatta: (id: string) => [...queryKeys.checklists.all, 'regatta', id] as const,
    templates: () => [...queryKeys.checklists.all, 'templates'] as const,
    raceChecklist: (raceId: string) =>
      [...queryKeys.checklists.all, 'raceChecklist', raceId] as const,
    progress: (raceId: string) => [...queryKeys.checklists.all, 'progress', raceId] as const,
  },

  // Singular alias used by useChecklists hook
  get checklist() {
    return queryKeys.checklists;
  },

  // Team Rankings
  teamRankings: {
    all: ['teamRankings'] as const,
    rankings: (filters?: Record<string, unknown>) =>
      [...queryKeys.teamRankings.all, 'rankings', { filters }] as const,
  },

  // Concept2
  concept2: {
    all: ['concept2'] as const,
    status: (athleteId: string) => [...queryKeys.concept2.all, 'status', athleteId] as const,
    teamStatuses: () => [...queryKeys.concept2.all, 'teamStatuses'] as const,
  },

  // Rigging
  rigging: {
    all: ['rigging'] as const,
    profiles: () => [...queryKeys.rigging.all, 'profiles'] as const,
    profile: (shellId: string) => [...queryKeys.rigging.all, 'profile', shellId] as const,
    defaults: (boatClass?: string) =>
      boatClass
        ? ([...queryKeys.rigging.all, 'defaults', boatClass] as const)
        : ([...queryKeys.rigging.all, 'defaults'] as const),
  },

  // Equipment
  equipment: {
    all: ['equipment'] as const,
    availability: (date?: string, excludeLineupId?: string) =>
      date
        ? ([...queryKeys.equipment.all, 'availability', date, excludeLineupId] as const)
        : ([...queryKeys.equipment.all, 'availability'] as const),
    assignments: (dateOrLineupId: string) =>
      [...queryKeys.equipment.all, 'assignments', dateOrLineupId] as const,
    lineupAssignments: (lineupId: string) =>
      [...queryKeys.equipment.all, 'lineupAssignments', lineupId] as const,
  },

  // Lineup Templates
  lineupTemplates: {
    all: ['lineupTemplates'] as const,
    list: () => [...queryKeys.lineupTemplates.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.lineupTemplates.all, 'detail', id] as const,
  },

  // Lineup Search
  lineupSearch: {
    all: ['lineupSearch'] as const,
    search: (filters?: Record<string, unknown>) =>
      [...queryKeys.lineupSearch.all, 'search', { filters }] as const,
    results: (filters?: Record<string, unknown>) =>
      [...queryKeys.lineupSearch.all, 'results', { filters }] as const,
  },

  // Composite Rankings
  compositeRankings: {
    all: ['compositeRankings'] as const,
    rankings: (filters?: Record<string, unknown>) =>
      [...queryKeys.compositeRankings.all, 'rankings', { filters }] as const,
  },

  // Matrix Planner
  matrixPlanner: {
    all: ['matrixPlanner'] as const,
    plan: (id: string) => [...queryKeys.matrixPlanner.all, 'plan', id] as const,
  },

  // Gamification
  gamification: {
    all: ['gamification'] as const,
    preferences: () => [...queryKeys.gamification.all, 'preferences'] as const,
  },

  // Integrations
  integration: {
    all: ['integration'] as const,
    c2: {
      status: () => [...queryKeys.integration.all, 'c2', 'status'] as const,
      syncConfig: () => [...queryKeys.integration.all, 'c2', 'syncConfig'] as const,
    },
    strava: {
      status: () => [...queryKeys.integration.all, 'strava', 'status'] as const,
    },
  },
} as const;
