import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoatRoster } from './BoatRoster';

const mockBoat = {
  id: 'varsity-8',
  name: 'Varsity 8+',
  coxswain: { name: 'Williams' },
  seats: [
    { number: 8, athlete: { name: 'Smith' }, side: 'P' },
    { number: 7, athlete: { name: 'Jones' }, side: 'S' },
    { number: 6, athlete: { name: 'Brown' }, side: 'P' },
    { number: 5, athlete: { name: 'Wilson' }, side: 'S' },
    { number: 4, athlete: { name: 'Davis' }, side: 'P' },
    { number: 3, athlete: { name: 'Lee' }, side: 'S' },
    { number: 2, athlete: { name: 'Kim' }, side: 'P' },
    { number: 1, athlete: { name: 'Chen' }, side: 'S' },
  ],
};

const mockBoats = [
  mockBoat,
  {
    id: 'jv-8',
    name: 'JV 8+',
    coxswain: { name: 'Taylor' },
    seats: [],
  },
];

describe('BoatRoster', () => {
  it('renders boat name', () => {
    render(<BoatRoster boat={mockBoat} boats={[mockBoat]} />);
    expect(screen.getByText('Varsity 8+')).toBeInTheDocument();
  });

  it('renders coxswain name', () => {
    render(<BoatRoster boat={mockBoat} boats={[mockBoat]} />);
    expect(screen.getByText('Williams')).toBeInTheDocument();
  });

  it('renders all athlete names', () => {
    render(<BoatRoster boat={mockBoat} boats={[mockBoat]} />);
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText('Jones')).toBeInTheDocument();
    expect(screen.getByText('Brown')).toBeInTheDocument();
    expect(screen.getByText('Wilson')).toBeInTheDocument();
    expect(screen.getByText('Davis')).toBeInTheDocument();
    expect(screen.getByText('Lee')).toBeInTheDocument();
    expect(screen.getByText('Kim')).toBeInTheDocument();
    expect(screen.getByText('Chen')).toBeInTheDocument();
  });

  it('shows port and starboard indicators', () => {
    render(<BoatRoster boat={mockBoat} boats={[mockBoat]} />);
    const portIndicators = screen.getAllByText('(P)');
    const starboardIndicators = screen.getAllByText('(S)');
    expect(portIndicators.length).toBe(4);
    expect(starboardIndicators.length).toBe(4);
  });

  it('renders dropdown when multiple boats available', () => {
    render(<BoatRoster boat={mockBoat} boats={mockBoats} />);
    const boatButton = screen.getByText('Varsity 8+');
    fireEvent.click(boatButton);
    expect(screen.getByText('JV 8+')).toBeInTheDocument();
  });

  it('calls onBoatSwitch when boat is switched', () => {
    const onBoatSwitch = vi.fn();
    render(
      <BoatRoster
        boat={mockBoat}
        boats={mockBoats}
        onBoatSwitch={onBoatSwitch}
      />
    );

    const boatButton = screen.getByText('Varsity 8+');
    fireEvent.click(boatButton);
    const jvBoat = screen.getByText('JV 8+');
    fireEvent.click(jvBoat);

    expect(onBoatSwitch).toHaveBeenCalledWith(mockBoats[1]);
  });

  it('calls onAthleteClick when athlete is clicked', () => {
    const onAthleteClick = vi.fn();
    render(
      <BoatRoster
        boat={mockBoat}
        boats={[mockBoat]}
        onAthleteClick={onAthleteClick}
      />
    );

    const smith = screen.getByText('Smith');
    fireEvent.click(smith);

    expect(onAthleteClick).toHaveBeenCalledWith({ name: 'Smith' });
  });

  it('shows "No boat assigned" when boat is null', () => {
    render(<BoatRoster boat={null} boats={[]} />);
    expect(screen.getByText('No boat assigned')).toBeInTheDocument();
  });

  it('displays seat numbers correctly', () => {
    render(<BoatRoster boat={mockBoat} boats={[mockBoat]} />);
    expect(screen.getByText('8:')).toBeInTheDocument();
    expect(screen.getByText('1:')).toBeInTheDocument();
  });
});
