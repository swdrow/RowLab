import { describe, expect, it } from 'vitest';
import { mapBoatsForPrintableLineup } from './ExportPDFButton';

describe('mapBoatsForPrintableLineup', () => {
  it('maps V1 boats with boatConfig and coxswain seat', () => {
    const athlete = { firstName: 'Alex', lastName: 'Rower' };
    const coxswain = { firstName: 'Casey', lastName: 'Swain' };
    const boats = [
      {
        id: 'boat-1',
        boatConfig: { name: 'Varsity 8+', numSeats: 8, hasCoxswain: true },
        shell: { name: 'Seaweed' },
        seats: [
          { seatNumber: 1, side: 'N/A', athlete, isCoxswain: false },
          { seatNumber: 2, side: 'Unknown', athlete: null, isCoxswain: false },
          { seatNumber: 0, side: 'N/A', athlete: coxswain, isCoxswain: true },
        ],
      },
    ];

    const [mapped] = mapBoatsForPrintableLineup(boats);

    expect(mapped.name).toBe('Varsity 8+');
    expect(mapped.shellName).toBe('Seaweed');
    expect(mapped.hasCoxswain).toBe(true);
    expect(mapped.seats).toHaveLength(2);
    expect(mapped.seats[0].side).toBe('Port');
    expect(mapped.seats[1].side).toBe('Port');
    expect(mapped.coxswain).toEqual(coxswain);
  });

  it('preserves V2 boat fields', () => {
    const boats = [
      {
        id: 2,
        name: 'JV 4+',
        shellName: 'Arrow',
        numSeats: 4,
        hasCoxswain: false,
        seats: [{ seatNumber: 1, side: 'Starboard', athlete: null }],
        coxswain: null,
        isExpanded: false,
      },
    ];

    const [mapped] = mapBoatsForPrintableLineup(boats);

    expect(mapped.id).toBe('2');
    expect(mapped.name).toBe('JV 4+');
    expect(mapped.shellName).toBe('Arrow');
    expect(mapped.hasCoxswain).toBe(false);
    expect(mapped.seats[0].side).toBe('Starboard');
  });
});
