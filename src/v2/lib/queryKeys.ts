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
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    team: () => [...queryKeys.settings.all, 'team'] as const,
    integrations: () => [...queryKeys.settings.all, 'integrations'] as const,
    subscription: () => [...queryKeys.settings.all, 'subscription'] as const,
  },

  // Achievements
  achievements: {
    all: ['achievements'] as const,
    athlete: (id: string) => [...queryKeys.achievements.all, 'athlete', id] as const,
    definitions: () => [...queryKeys.achievements.all, 'definitions'] as const,
  },

  // Personal Records
  personalRecords: {
    all: ['personalRecords'] as const,
    athlete: (id: string) => [...queryKeys.personalRecords.all, 'athlete', id] as const,
    ranks: () => [...queryKeys.personalRecords.all, 'ranks'] as const,
  },

  // Challenges
  challenges: {
    all: ['challenges'] as const,
    lists: () => [...queryKeys.challenges.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.challenges.all, 'detail', id] as const,
    leaderboard: (id: string) => [...queryKeys.challenges.all, 'leaderboard', id] as const,
  },

  // Streaks
  streaks: {
    all: ['streaks'] as const,
    athlete: (id: string) => [...queryKeys.streaks.all, 'athlete', id] as const,
  },

  // Recruit Visits
  recruitVisits: {
    all: ['recruitVisits'] as const,
    lists: () => [...queryKeys.recruitVisits.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.recruitVisits.all, 'detail', id] as const,
    upcoming: () => [...queryKeys.recruitVisits.all, 'upcoming'] as const,
  },

  // Checklists
  checklists: {
    all: ['checklists'] as const,
    regatta: (id: string) => [...queryKeys.checklists.all, 'regatta', id] as const,
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
    profile: (shellId: string) => [...queryKeys.rigging.all, 'profile', shellId] as const,
    defaults: (boatClass: string) => [...queryKeys.rigging.all, 'defaults', boatClass] as const,
  },

  // Equipment
  equipment: {
    all: ['equipment'] as const,
    assignments: (lineupId: string) =>
      [...queryKeys.equipment.all, 'assignments', lineupId] as const,
    availability: () => [...queryKeys.equipment.all, 'availability'] as const,
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
} as const;
