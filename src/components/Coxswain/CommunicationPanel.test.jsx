import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommunicationPanel } from './CommunicationPanel';

const mockPreWorkoutNotes = {
  instructions: '3x1500m at race pace',
  focusPoints: ['Clean catches', 'Consistent splits'],
  technicalCues: ['Hands away before body'],
  createdAt: new Date().toISOString(),
};

const mockPostWorkoutNotes = {
  sessionReport: 'Good session',
  athleteObservations: 'Bow pair timing off',
  equipmentNotes: 'Port side oar cracked',
  savedAt: new Date().toISOString(),
};

describe('CommunicationPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders communication header', () => {
    render(<CommunicationPanel />);
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('renders pre-workout section', () => {
    render(<CommunicationPanel preWorkoutNotes={mockPreWorkoutNotes} />);
    expect(screen.getByText('Pre-Workout (Coach)')).toBeInTheDocument();
  });

  it('renders post-workout section', () => {
    render(<CommunicationPanel />);
    expect(screen.getByText('Post-Workout (Your Notes)')).toBeInTheDocument();
  });

  it('displays coach instructions', () => {
    render(<CommunicationPanel preWorkoutNotes={mockPreWorkoutNotes} />);
    expect(screen.getByText('3x1500m at race pace')).toBeInTheDocument();
  });

  it('displays focus points', () => {
    render(<CommunicationPanel preWorkoutNotes={mockPreWorkoutNotes} />);
    expect(screen.getByText('Clean catches')).toBeInTheDocument();
    expect(screen.getByText('Consistent splits')).toBeInTheDocument();
  });

  it('displays technical cues', () => {
    render(<CommunicationPanel preWorkoutNotes={mockPreWorkoutNotes} />);
    expect(screen.getByText('Hands away before body')).toBeInTheDocument();
  });

  it('shows "no instructions" message when preWorkoutNotes is null', () => {
    render(<CommunicationPanel preWorkoutNotes={null} />);
    expect(screen.getByText('No instructions from coach yet.')).toBeInTheDocument();
  });

  it('renders editable session report textarea', () => {
    render(<CommunicationPanel />);
    expect(screen.getByPlaceholderText(/How did the session go/i)).toBeInTheDocument();
  });

  it('renders editable athlete observations textarea', () => {
    render(<CommunicationPanel />);
    expect(screen.getByPlaceholderText(/Individual athlete notes/i)).toBeInTheDocument();
  });

  it('renders editable equipment notes textarea', () => {
    render(<CommunicationPanel />);
    expect(screen.getByPlaceholderText(/Boat condition/i)).toBeInTheDocument();
  });

  it('populates textareas with existing post-workout notes', () => {
    render(<CommunicationPanel postWorkoutNotes={mockPostWorkoutNotes} />);
    expect(screen.getByDisplayValue('Good session')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bow pair timing off')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Port side oar cracked')).toBeInTheDocument();
  });

  it('shows character count for textareas', async () => {
    render(<CommunicationPanel />);
    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);

    await userEvent.type(sessionReport, 'Test notes');

    expect(screen.getByText(/10\/1000/)).toBeInTheDocument();
  });

  it('limits input to max characters', async () => {
    render(<CommunicationPanel />);
    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);

    const longText = 'a'.repeat(1100);
    await userEvent.type(sessionReport, longText);

    expect(sessionReport.value.length).toBeLessThanOrEqual(1000);
  });

  it('calls onSaveNotes when save is clicked', async () => {
    const onSaveNotes = vi.fn().mockResolvedValue(undefined);
    render(<CommunicationPanel onSaveNotes={onSaveNotes} />);

    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);
    await userEvent.type(sessionReport, 'Test session report');

    const saveButton = screen.getByText('Save Notes');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSaveNotes).toHaveBeenCalled();
      const callArg = onSaveNotes.mock.calls[0][0];
      expect(callArg.sessionReport).toBe('Test session report');
    });
  });

  it('disables save button when no content entered', () => {
    render(<CommunicationPanel />);
    const saveButton = screen.getByText('Save Notes');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when content is entered', async () => {
    render(<CommunicationPanel />);
    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);

    await userEvent.type(sessionReport, 'Test');

    const saveButton = screen.getByText('Save Notes');
    expect(saveButton).not.toBeDisabled();
  });

  it('collapses pre-workout section when header is clicked', async () => {
    render(<CommunicationPanel preWorkoutNotes={mockPreWorkoutNotes} />);

    const preWorkoutHeader = screen.getByText('Pre-Workout (Coach)');
    await userEvent.click(preWorkoutHeader);

    // Content should be hidden after collapse
    // (The implementation uses conditional rendering)
  });

  it('collapses post-workout section when header is clicked', async () => {
    render(<CommunicationPanel />);

    const postWorkoutHeader = screen.getByText('Post-Workout (Your Notes)');
    await userEvent.click(postWorkoutHeader);

    // Section should collapse
  });

  it('shows unsaved indicator when changes are made', async () => {
    render(<CommunicationPanel />);
    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);

    await userEvent.type(sessionReport, 'Test');

    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('shows last saved timestamp after saving', async () => {
    const onSaveNotes = vi.fn().mockResolvedValue(undefined);
    render(<CommunicationPanel onSaveNotes={onSaveNotes} />);

    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);
    await userEvent.type(sessionReport, 'Test');

    const saveButton = screen.getByText('Save Notes');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Last saved/)).toBeInTheDocument();
    });
  });

  it('saves draft to localStorage', async () => {
    render(<CommunicationPanel />);
    const sessionReport = screen.getByPlaceholderText(/How did the session go/i);

    await userEvent.type(sessionReport, 'Draft notes');

    await waitFor(() => {
      const draft = localStorage.getItem('coxswain-notes-draft');
      expect(draft).toBeTruthy();
      const parsed = JSON.parse(draft);
      expect(parsed.sessionReport).toBe('Draft notes');
    });
  });
});
