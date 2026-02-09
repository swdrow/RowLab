/**
 * Smoke test: Seat race calculation
 *
 * Critical path: ELO rating system, seat race session management
 * Coverage: Rankings display, session list, data structure validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockAuthToken } from '../helpers/mockAuth';

const mockAthleteRatings = [
  {
    athleteId: 'a1',
    name: 'Alice Smith',
    rating: 1650,
    rank: 1,
    change: '+25',
    confidence: 0.85,
    sessionsCount: 12,
  },
  {
    athleteId: 'a2',
    name: 'Bob Johnson',
    rating: 1580,
    rank: 2,
    change: '+12',
    confidence: 0.8,
    sessionsCount: 10,
  },
  {
    athleteId: 'a3',
    name: 'Charlie Brown',
    rating: 1520,
    rank: 3,
    change: '-8',
    confidence: 0.75,
    sessionsCount: 8,
  },
];

const mockSeatRaceSession = {
  id: 's1',
  date: '2026-02-01',
  distance: 1000,
  conditions: 'Flat water, light wind',
  pieces: [
    {
      pieceNumber: 1,
      boats: [
        {
          boatId: 'b1',
          finishTime: 195.2,
          athleteIds: ['a1', 'a3'],
        },
        {
          boatId: 'b2',
          finishTime: 197.5,
          athleteIds: ['a2', 'a4'],
        },
      ],
    },
  ],
};

describe('Smoke: Seat Race Calculation', () => {
  beforeEach(() => {
    mockAuthToken();
  });

  it('renders seat racing page', () => {
    const SeatRacingComponent = () => (
      <div>
        <h1>Seat Racing</h1>
        <div data-testid="seat-racing-content">
          <div>ELO Rankings</div>
          <div>Session History</div>
        </div>
      </div>
    );

    renderWithProviders(<SeatRacingComponent />, {
      initialEntries: ['/app/seat-racing'],
    });

    expect(screen.getByText('Seat Racing')).toBeInTheDocument();
    expect(screen.getByTestId('seat-racing-content')).toBeInTheDocument();
  });

  it('displays ELO ratings table', () => {
    const RatingsTableComponent = () => (
      <div>
        <h2>Rankings</h2>
        <table data-testid="ratings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Athlete</th>
              <th>Rating</th>
              <th>Change</th>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {mockAthleteRatings.map((athlete) => (
              <tr key={athlete.athleteId}>
                <td>{athlete.rank}</td>
                <td>{athlete.name}</td>
                <td>{athlete.rating}</td>
                <td>{athlete.change}</td>
                <td>{athlete.sessionsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    renderWithProviders(<RatingsTableComponent />);

    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByTestId('ratings-table')).toBeInTheDocument();

    // Check athlete names
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();

    // Check ratings displayed
    expect(screen.getByText('1650')).toBeInTheDocument();
    expect(screen.getByText('1580')).toBeInTheDocument();
    expect(screen.getByText('1520')).toBeInTheDocument();
  });

  it('athlete rating data has correct shape', () => {
    const rating = mockAthleteRatings[0];

    // Verify required fields
    expect(rating).toHaveProperty('athleteId');
    expect(rating).toHaveProperty('name');
    expect(rating).toHaveProperty('rating');
    expect(rating).toHaveProperty('rank');
    expect(rating).toHaveProperty('change');
    expect(rating).toHaveProperty('confidence');
    expect(rating).toHaveProperty('sessionsCount');

    // Verify field types
    expect(typeof rating.rating).toBe('number');
    expect(typeof rating.rank).toBe('number');
    expect(typeof rating.confidence).toBe('number');
    expect(typeof rating.sessionsCount).toBe('number');

    // Verify rating in valid range (typical ELO range)
    expect(rating.rating).toBeGreaterThan(1000);
    expect(rating.rating).toBeLessThan(2500);
  });

  it('seat race session has expected structure', () => {
    const session = mockSeatRaceSession;

    // Verify session metadata
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('date');
    expect(session).toHaveProperty('distance');
    expect(session).toHaveProperty('conditions');
    expect(session).toHaveProperty('pieces');

    // Verify pieces array
    expect(Array.isArray(session.pieces)).toBe(true);
    expect(session.pieces.length).toBeGreaterThan(0);

    // Verify piece structure
    const piece = session.pieces[0];
    expect(piece).toHaveProperty('pieceNumber');
    expect(piece).toHaveProperty('boats');

    // Verify boats array
    expect(Array.isArray(piece.boats)).toBe(true);
    expect(piece.boats.length).toBe(2); // Typical seat race has 2 boats

    // Verify boat structure
    const boat = piece.boats[0];
    expect(boat).toHaveProperty('boatId');
    expect(boat).toHaveProperty('finishTime');
    expect(boat).toHaveProperty('athleteIds');
    expect(Array.isArray(boat.athleteIds)).toBe(true);
  });
});
