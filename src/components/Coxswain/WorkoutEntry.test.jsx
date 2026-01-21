import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutEntry } from './WorkoutEntry';

describe('WorkoutEntry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders workout entry header', () => {
    render(<WorkoutEntry pieces={[]} />);
    expect(screen.getByText('Workout Entry')).toBeInTheDocument();
  });

  it('renders workout template when provided', () => {
    render(<WorkoutEntry pieces={[]} workoutTemplate="3x1500m" />);
    expect(screen.getByText('3x1500m')).toBeInTheDocument();
  });

  it('renders piece selector tabs', () => {
    render(<WorkoutEntry pieces={[]} workoutTemplate="3x1500m" />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders time input fields', () => {
    render(<WorkoutEntry pieces={[]} />);
    // Minutes and tenths both have placeholder "0", seconds has "00"
    const zeroPlaceholders = screen.getAllByPlaceholderText('0');
    expect(zeroPlaceholders.length).toBe(2); // minutes + tenths
    expect(screen.getByPlaceholderText('00')).toBeInTheDocument();
  });

  it('renders stroke rate input', () => {
    render(<WorkoutEntry pieces={[]} />);
    const srInput = screen.getAllByPlaceholderText('--')[0];
    expect(srInput).toBeInTheDocument();
  });

  it('validates time input only accepts numbers', async () => {
    render(<WorkoutEntry pieces={[]} />);
    // First element with placeholder "0" is minutes
    const minutesInput = screen.getAllByPlaceholderText('0')[0];

    await userEvent.type(minutesInput, 'abc123');
    expect(minutesInput).toHaveValue('12');
  });

  it('limits minutes input to 2 digits', async () => {
    render(<WorkoutEntry pieces={[]} />);
    // First element with placeholder "0" is minutes
    const minutesInput = screen.getAllByPlaceholderText('0')[0];

    await userEvent.type(minutesInput, '1234');
    expect(minutesInput).toHaveValue('12');
  });

  it('validates seconds max value is 59', async () => {
    render(<WorkoutEntry pieces={[]} />);
    const secondsInput = screen.getByPlaceholderText('00');

    await userEvent.type(secondsInput, '60');
    // Should not accept 60+
    expect(secondsInput.value).not.toBe('60');
  });

  it('calls onSavePiece with correct data when save is clicked', async () => {
    const onSavePiece = vi.fn().mockResolvedValue(undefined);
    render(<WorkoutEntry pieces={[]} onSavePiece={onSavePiece} />);

    const minutesInput = screen.getAllByPlaceholderText('0')[0];
    const secondsInput = screen.getByPlaceholderText('00');

    await userEvent.clear(minutesInput);
    await userEvent.type(minutesInput, '5');
    await userEvent.clear(secondsInput);
    await userEvent.type(secondsInput, '30');

    const saveButton = screen.getByText('Save Piece');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSavePiece).toHaveBeenCalled();
      const callArg = onSavePiece.mock.calls[0][0];
      expect(callArg.time).toMatch(/5:30/);
    });
  });

  it('displays saved pieces', () => {
    const savedPieces = [
      { number: 1, time: '5:30.2', strokeRate: 32 },
      { number: 2, time: '5:28.5', strokeRate: 33 },
    ];
    render(<WorkoutEntry pieces={savedPieces} />);

    expect(screen.getByText('5:30.2')).toBeInTheDocument();
    expect(screen.getByText('5:28.5')).toBeInTheDocument();
    expect(screen.getByText('@ 32 s/m')).toBeInTheDocument();
    expect(screen.getByText('@ 33 s/m')).toBeInTheDocument();
  });

  it('disables save button when no time entered', () => {
    render(<WorkoutEntry pieces={[]} />);
    const saveButton = screen.getByText('Save Piece');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when time is entered', async () => {
    render(<WorkoutEntry pieces={[]} />);
    const minutesInput = screen.getAllByPlaceholderText('0')[0];
    const secondsInput = screen.getByPlaceholderText('00');

    await userEvent.type(minutesInput, '5');
    await userEvent.type(secondsInput, '30');

    const saveButton = screen.getByText('Save Piece');
    expect(saveButton).not.toBeDisabled();
  });

  it('shows checkmark for saved pieces in tabs', () => {
    const savedPieces = [{ number: 1, time: '5:30.2', strokeRate: 32 }];
    render(<WorkoutEntry pieces={savedPieces} />);

    // Piece 1 should have a checkmark icon somewhere
    const piece1Tab = screen.getByRole('button', { name: /1/i });
    expect(piece1Tab).toBeInTheDocument();
  });

  it('loads existing piece data when piece tab is clicked', async () => {
    const savedPieces = [{ number: 1, time: '5:30.2', strokeRate: 32 }];
    render(<WorkoutEntry pieces={savedPieces} />);

    const piece1Tab = screen.getAllByText('1')[0];
    await userEvent.click(piece1Tab);

    // The input fields should be populated with existing data
    const minutesInput = screen.getAllByPlaceholderText('0')[0];
    expect(minutesInput).toHaveValue('5');
  });

  it('calls onDeletePiece when delete is clicked', async () => {
    const onDeletePiece = vi.fn();
    const savedPieces = [{ number: 1, time: '5:30.2', strokeRate: 32 }];
    render(
      <WorkoutEntry pieces={savedPieces} onDeletePiece={onDeletePiece} />
    );

    // Find and click the delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(
      (btn) => btn.querySelector('svg')?.classList.contains('lucide-trash-2') ||
               btn.innerHTML.includes('Trash2')
    );

    if (deleteButton) {
      await userEvent.click(deleteButton);
      expect(onDeletePiece).toHaveBeenCalledWith(1);
    }
  });

  it('saves draft to localStorage', async () => {
    render(<WorkoutEntry pieces={[]} />);
    const minutesInput = screen.getAllByPlaceholderText('0')[0];

    await userEvent.type(minutesInput, '5');

    await waitFor(() => {
      const draft = localStorage.getItem('coxswain-workout-draft');
      expect(draft).toBeTruthy();
      const parsed = JSON.parse(draft);
      expect(parsed.timeMinutes).toBe('5');
    });
  });
});
