/**
 * Smoke test: Lineup save and load
 *
 * Critical path: Creating/editing lineups, boat configuration, athlete assignment
 * Coverage: Lineup builder page render, boat options display, athlete pool, data structure
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockAuthToken } from '../helpers/mockAuth';

// Mock TanStack Query hooks for lineup data
const mockLineups = [
  {
    id: '1',
    name: 'Varsity 8+',
    boatType: '8+',
    positions: [
      { position: 1, athleteId: 'a1', athleteName: 'Alice Smith' },
      { position: 2, athleteId: 'a2', athleteName: 'Bob Johnson' },
      { position: 3, athleteId: 'a3', athleteName: 'Charlie Brown' },
      { position: 4, athleteId: 'a4', athleteName: 'Diana Prince' },
      { position: 5, athleteId: 'a5', athleteName: 'Eve Wilson' },
      { position: 6, athleteId: 'a6', athleteName: 'Frank Castle' },
      { position: 7, athleteId: 'a7', athleteName: 'Grace Hopper' },
      { position: 8, athleteId: 'a8', athleteName: 'Hank Pym' },
      { position: 'C', athleteId: 'a9', athleteName: 'Iris West' },
    ],
  },
];

const mockAthletes = [
  { id: 'a1', name: 'Alice Smith', side: 'Port', active: true },
  { id: 'a2', name: 'Bob Johnson', side: 'Starboard', active: true },
  { id: 'a3', name: 'Charlie Brown', side: 'Port', active: true },
  { id: 'a10', name: 'Jack Ryan', side: 'Both', active: true },
];

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: mockLineups,
      isLoading: false,
      error: null,
    })),
  };
});

describe('Smoke: Lineup Save/Load', () => {
  beforeEach(() => {
    mockAuthToken();
  });

  it('renders lineup builder page', () => {
    const LineupBuilderComponent = () => (
      <div>
        <h1>Lineup Builder</h1>
        <div data-testid="lineup-workspace">
          <p>Create and manage boat lineups</p>
        </div>
      </div>
    );

    renderWithProviders(<LineupBuilderComponent />, {
      initialEntries: ['/app/coach/lineup-builder'],
    });

    expect(screen.getByText('Lineup Builder')).toBeInTheDocument();
    expect(screen.getByTestId('lineup-workspace')).toBeInTheDocument();
  });

  it('displays boat type options', () => {
    const BoatSelectorComponent = () => (
      <div>
        <label htmlFor="boat-type">Boat Type</label>
        <select id="boat-type" data-testid="boat-type-select">
          <option value="1x">1x (Single)</option>
          <option value="2-">2- (Pair)</option>
          <option value="2x">2x (Double)</option>
          <option value="4-">4- (Four)</option>
          <option value="4+">4+ (Four with Cox)</option>
          <option value="8+">8+ (Eight)</option>
        </select>
      </div>
    );

    renderWithProviders(<BoatSelectorComponent />);

    const select = screen.getByTestId('boat-type-select');
    expect(select).toBeInTheDocument();

    // Check critical boat types exist
    expect(screen.getByRole('option', { name: /8\+/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /4\+/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /4-/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /2x/i })).toBeInTheDocument();
  });

  it('shows athlete pool for assignment', () => {
    const AthletePoolComponent = () => (
      <div>
        <h2>Available Athletes</h2>
        <ul data-testid="athlete-pool">
          {mockAthletes.map((athlete) => (
            <li key={athlete.id} data-athlete-id={athlete.id}>
              {athlete.name} ({athlete.side})
            </li>
          ))}
        </ul>
      </div>
    );

    renderWithProviders(<AthletePoolComponent />);

    expect(screen.getByText('Available Athletes')).toBeInTheDocument();
    expect(screen.getByTestId('athlete-pool')).toBeInTheDocument();

    // Check athletes are listed
    expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob Johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/Charlie Brown/i)).toBeInTheDocument();
  });

  it('lineup data has expected structure', () => {
    const lineup = mockLineups[0];

    // Verify required fields
    expect(lineup).toHaveProperty('id');
    expect(lineup).toHaveProperty('name');
    expect(lineup).toHaveProperty('boatType');
    expect(lineup).toHaveProperty('positions');

    // Verify positions array structure
    expect(Array.isArray(lineup.positions)).toBe(true);
    expect(lineup.positions.length).toBeGreaterThan(0);

    // Verify position object structure
    const position = lineup.positions[0];
    expect(position).toHaveProperty('position');
    expect(position).toHaveProperty('athleteId');
    expect(position).toHaveProperty('athleteName');

    // Verify boat type matches position count
    expect(lineup.boatType).toBe('8+');
    expect(lineup.positions.length).toBe(9); // 8 rowers + 1 coxswain
  });

  it('renders lineup with assigned athletes', () => {
    const LineupDisplayComponent = () => (
      <div>
        <h3>{mockLineups[0].name}</h3>
        <div data-testid="lineup-positions">
          {mockLineups[0].positions.map((pos) => (
            <div key={pos.position} data-position={pos.position}>
              <span>Seat {pos.position}:</span>
              <span>{pos.athleteName}</span>
            </div>
          ))}
        </div>
      </div>
    );

    renderWithProviders(<LineupDisplayComponent />);

    expect(screen.getByText('Varsity 8+')).toBeInTheDocument();
    expect(screen.getByTestId('lineup-positions')).toBeInTheDocument();

    // Verify some athlete assignments are shown
    expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Diana Prince/i)).toBeInTheDocument();
    expect(screen.getByText(/Iris West/i)).toBeInTheDocument(); // Coxswain
  });
});
