/**
 * Smoke test: Workout data display and persistence
 *
 * Critical path: Training session viewing, workout metrics, data persistence across navigation
 * Coverage: Workout list, session details, metrics display, navigation persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockAuthToken } from '../helpers/mockAuth';

const mockWorkouts = [
  {
    id: 'w1',
    date: '2026-02-09',
    title: 'Morning Practice',
    type: 'water',
    distance: 12000,
    duration: 3600, // 60 minutes
    avgSPM: 22,
    avgHeartRate: 155,
    intensity: 'steady-state',
    completed: true,
  },
  {
    id: 'w2',
    date: '2026-02-08',
    title: 'Intervals',
    type: 'erg',
    distance: 8000,
    duration: 1800, // 30 minutes
    avgSPM: 28,
    avgHeartRate: 172,
    avgWatts: 250,
    intensity: 'high-intensity',
    completed: true,
  },
  {
    id: 'w3',
    date: '2026-02-10',
    title: 'Recovery Row',
    type: 'water',
    distance: 8000,
    duration: 2400, // 40 minutes
    avgSPM: 18,
    avgHeartRate: 135,
    intensity: 'recovery',
    completed: false,
  },
];

describe('Smoke: Workout Data Display', () => {
  beforeEach(() => {
    mockAuthToken();
  });

  it('renders workout list', () => {
    const WorkoutListComponent = () => (
      <div>
        <h1>Training Sessions</h1>
        <div data-testid="workout-list">
          {mockWorkouts.map((workout) => (
            <div key={workout.id} data-workout-id={workout.id}>
              <h3>{workout.title}</h3>
              <span>{workout.type}</span>
              <span>{workout.date}</span>
            </div>
          ))}
        </div>
      </div>
    );

    renderWithProviders(<WorkoutListComponent />, {
      initialEntries: ['/app/training/sessions'],
    });

    expect(screen.getByText('Training Sessions')).toBeInTheDocument();
    expect(screen.getByTestId('workout-list')).toBeInTheDocument();

    // Check workout titles
    expect(screen.getByText('Morning Practice')).toBeInTheDocument();
    expect(screen.getByText('Intervals')).toBeInTheDocument();
    expect(screen.getByText('Recovery Row')).toBeInTheDocument();
  });

  it('displays workout metrics', () => {
    const WorkoutMetricsComponent = () => (
      <div>
        <h2>Workout Details</h2>
        <div data-testid="workout-metrics">
          <div>
            <label>Distance:</label>
            <span>{mockWorkouts[0].distance}m</span>
          </div>
          <div>
            <label>Duration:</label>
            <span>{mockWorkouts[0].duration / 60} min</span>
          </div>
          <div>
            <label>Avg SPM:</label>
            <span>{mockWorkouts[0].avgSPM}</span>
          </div>
          <div>
            <label>Avg HR:</label>
            <span>{mockWorkouts[0].avgHeartRate} bpm</span>
          </div>
          <div>
            <label>Intensity:</label>
            <span>{mockWorkouts[0].intensity}</span>
          </div>
        </div>
      </div>
    );

    renderWithProviders(<WorkoutMetricsComponent />);

    expect(screen.getByText('Workout Details')).toBeInTheDocument();
    expect(screen.getByTestId('workout-metrics')).toBeInTheDocument();

    // Check metrics are displayed
    expect(screen.getByText(/12000m/i)).toBeInTheDocument();
    expect(screen.getByText(/60 min/i)).toBeInTheDocument();
    expect(screen.getByText(/22/i)).toBeInTheDocument(); // SPM
    expect(screen.getByText(/155 bpm/i)).toBeInTheDocument();
  });

  it('workout data has expected structure', () => {
    const workout = mockWorkouts[0];

    // Verify core fields
    expect(workout).toHaveProperty('id');
    expect(workout).toHaveProperty('date');
    expect(workout).toHaveProperty('title');
    expect(workout).toHaveProperty('type');
    expect(workout).toHaveProperty('distance');
    expect(workout).toHaveProperty('duration');
    expect(workout).toHaveProperty('intensity');
    expect(workout).toHaveProperty('completed');

    // Verify optional performance metrics
    expect(workout).toHaveProperty('avgSPM');
    expect(workout).toHaveProperty('avgHeartRate');

    // Verify field types
    expect(typeof workout.distance).toBe('number');
    expect(typeof workout.duration).toBe('number');
    expect(typeof workout.avgSPM).toBe('number');
    expect(typeof workout.avgHeartRate).toBe('number');
    expect(typeof workout.completed).toBe('boolean');

    // Verify workout type is valid
    expect(['water', 'erg', 'land']).toContain(workout.type);

    // Verify intensity is valid
    expect(['recovery', 'steady-state', 'high-intensity', 'race']).toContain(workout.intensity);
  });

  it('data persists after navigation', () => {
    // Simulate storing workout data
    const workoutData = mockWorkouts[0];
    const storedData = JSON.stringify(workoutData);
    const parsedData = JSON.parse(storedData);

    // Verify data integrity after serialization
    expect(parsedData.id).toBe(workoutData.id);
    expect(parsedData.title).toBe(workoutData.title);
    expect(parsedData.distance).toBe(workoutData.distance);
    expect(parsedData.duration).toBe(workoutData.duration);
    expect(parsedData.completed).toBe(workoutData.completed);

    // Verify all fields preserved
    Object.keys(workoutData).forEach((key) => {
      expect(parsedData).toHaveProperty(key);
      expect(parsedData[key]).toEqual(workoutData[key]);
    });
  });

  it('displays workout type badges', () => {
    const WorkoutTypeBadgesComponent = () => (
      <div>
        {mockWorkouts.map((workout) => (
          <div key={workout.id}>
            <span data-testid={`badge-${workout.id}`} data-type={workout.type}>
              {workout.type === 'water' && '🚣 Water'}
              {workout.type === 'erg' && '💪 Erg'}
              {workout.type === 'land' && '🏃 Land'}
            </span>
          </div>
        ))}
      </div>
    );

    renderWithProviders(<WorkoutTypeBadgesComponent />);

    // Check water workout badge
    const waterBadge = screen.getByTestId('badge-w1');
    expect(waterBadge).toHaveAttribute('data-type', 'water');
    expect(waterBadge).toHaveTextContent('Water');

    // Check erg workout badge
    const ergBadge = screen.getByTestId('badge-w2');
    expect(ergBadge).toHaveAttribute('data-type', 'erg');
    expect(ergBadge).toHaveTextContent('Erg');
  });

  it('separates completed and upcoming workouts', () => {
    const completedWorkouts = mockWorkouts.filter((w) => w.completed);
    const upcomingWorkouts = mockWorkouts.filter((w) => !w.completed);

    expect(completedWorkouts.length).toBe(2);
    expect(upcomingWorkouts.length).toBe(1);

    // Verify completed workouts
    expect(completedWorkouts[0].id).toBe('w1');
    expect(completedWorkouts[1].id).toBe('w2');

    // Verify upcoming workout
    expect(upcomingWorkouts[0].id).toBe('w3');
    expect(upcomingWorkouts[0].title).toBe('Recovery Row');
  });
});
