import {
  fitBradleyTerryModel,
  computeProbabilityMatrix,
  computeStandardErrors,
} from '../bradleyTerryService.js';

describe('bradleyTerryService', () => {
  describe('fitBradleyTerryModel', () => {
    test('simple 2-athlete case: A beats B 3 times, B beats A 1 time', () => {
      const comparisons = [
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'B', athlete2Id: 'A', athlete1Win: true }, // B beats A
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: false });

      expect(result).toHaveProperty('athletes');
      expect(result).toHaveProperty('convergence');
      expect(result.athletes).toHaveLength(2);

      const athleteA = result.athletes.find(a => a.athleteId === 'A');
      const athleteB = result.athletes.find(a => a.athleteId === 'B');

      // A's strength should be higher than B's
      expect(athleteA.strength).toBeGreaterThan(athleteB.strength);

      // Probability P(A beats B) should be approximately 0.75
      const pMatrix = computeProbabilityMatrix(result.athletes);
      const aIndex = result.athletes.findIndex(a => a.athleteId === 'A');
      const bIndex = result.athletes.findIndex(a => a.athleteId === 'B');

      expect(pMatrix[aIndex][bIndex]).toBeCloseTo(0.75, 1);
    });

    test('3-athlete case: A > B > C (transitive)', () => {
      const comparisons = [
        // A beats B
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        // B beats C
        { athlete1Id: 'B', athlete2Id: 'C', athlete1Win: true },
        { athlete1Id: 'B', athlete2Id: 'C', athlete1Win: true },
        // A beats C
        { athlete1Id: 'A', athlete2Id: 'C', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'C', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'C', athlete1Win: true },
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: false });

      expect(result.athletes).toHaveLength(3);

      const athleteA = result.athletes.find(a => a.athleteId === 'A');
      const athleteB = result.athletes.find(a => a.athleteId === 'B');
      const athleteC = result.athletes.find(a => a.athleteId === 'C');

      // Rankings should be A > B > C
      expect(athleteA.strength).toBeGreaterThan(athleteB.strength);
      expect(athleteB.strength).toBeGreaterThan(athleteC.strength);

      // P(A beats C) > P(A beats B)
      const pMatrix = computeProbabilityMatrix(result.athletes);
      const aIndex = result.athletes.findIndex(a => a.athleteId === 'A');
      const bIndex = result.athletes.findIndex(a => a.athleteId === 'B');
      const cIndex = result.athletes.findIndex(a => a.athleteId === 'C');

      expect(pMatrix[aIndex][cIndex]).toBeGreaterThan(pMatrix[aIndex][bIndex]);
    });

    test('sparse data: A vs B only, B vs C only (transitivity)', () => {
      const comparisons = [
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'B', athlete2Id: 'C', athlete1Win: true },
        { athlete1Id: 'B', athlete2Id: 'C', athlete1Win: true },
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: false });

      expect(result.athletes).toHaveLength(3);

      const athleteA = result.athletes.find(a => a.athleteId === 'A');
      const athleteB = result.athletes.find(a => a.athleteId === 'B');
      const athleteC = result.athletes.find(a => a.athleteId === 'C');

      // Should still produce rankings via transitivity
      expect(athleteA.strength).toBeGreaterThan(athleteB.strength);
      expect(athleteB.strength).toBeGreaterThan(athleteC.strength);

      // A vs C should have higher standard error (no direct comparisons)
      expect(athleteA.stdError).toBeGreaterThan(0);
      expect(athleteC.stdError).toBeGreaterThan(0);
    });

    test('edge case: all ties (everyone beats everyone equally)', () => {
      const comparisons = [
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'B', athlete2Id: 'A', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'C', athlete1Win: true },
        { athlete1Id: 'C', athlete2Id: 'A', athlete1Win: true },
        { athlete1Id: 'B', athlete2Id: 'C', athlete1Win: true },
        { athlete1Id: 'C', athlete2Id: 'B', athlete1Win: true },
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: false });

      expect(result.athletes).toHaveLength(3);

      // All strengths should be approximately equal
      const strengths = result.athletes.map(a => a.strength);
      const maxStrength = Math.max(...strengths);
      const minStrength = Math.min(...strengths);

      expect(maxStrength - minStrength).toBeLessThan(0.5); // Nearly equal

      // All probabilities should be ~0.5
      const pMatrix = computeProbabilityMatrix(result.athletes);
      for (let i = 0; i < pMatrix.length; i++) {
        for (let j = 0; j < pMatrix.length; j++) {
          if (i !== j) {
            expect(pMatrix[i][j]).toBeCloseTo(0.5, 1);
          }
        }
      }
    });

    test('standard errors increase with fewer comparisons', () => {
      const manyComparisons = [
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
      ];

      const fewComparisons = [
        { athlete1Id: 'C', athlete2Id: 'D', athlete1Win: true },
      ];

      const resultMany = fitBradleyTerryModel(manyComparisons, { includeBoatSpeed: false });
      const resultFew = fitBradleyTerryModel(fewComparisons, { includeBoatSpeed: false });

      const stdErrorMany = resultMany.athletes[0].stdError;
      const stdErrorFew = resultFew.athletes[0].stdError;

      expect(stdErrorFew).toBeGreaterThan(stdErrorMany);
    });

    test('boat speed bias: A always in fast shell, B always in slow shell', () => {
      const comparisons = [
        {
          athlete1Id: 'A',
          athlete2Id: 'B',
          athlete1Win: true,
          shellId1: 'fast',
          shellId2: 'slow'
        },
        {
          athlete1Id: 'A',
          athlete2Id: 'B',
          athlete1Win: true,
          shellId1: 'fast',
          shellId2: 'slow'
        },
        {
          athlete1Id: 'A',
          athlete2Id: 'B',
          athlete1Win: true,
          shellId1: 'fast',
          shellId2: 'slow'
        },
      ];

      // Without boat speed correction - A appears stronger
      const resultNoBias = fitBradleyTerryModel(comparisons, { includeBoatSpeed: false });
      const athleteA_noBias = resultNoBias.athletes.find(a => a.athleteId === 'A');
      const athleteB_noBias = resultNoBias.athletes.find(a => a.athleteId === 'B');
      const strengthDiff_noBias = athleteA_noBias.strength - athleteB_noBias.strength;

      // With boat speed correction - shell speed parameter captures difference
      const resultWithBias = fitBradleyTerryModel(comparisons, { includeBoatSpeed: true });
      const athleteA_withBias = resultWithBias.athletes.find(a => a.athleteId === 'A');
      const athleteB_withBias = resultWithBias.athletes.find(a => a.athleteId === 'B');
      const strengthDiff_withBias = athleteA_withBias.strength - athleteB_withBias.strength;

      // With correction, strength difference should be smaller
      expect(Math.abs(strengthDiff_withBias)).toBeLessThan(Math.abs(strengthDiff_noBias));

      // Shell parameters should exist
      expect(resultWithBias).toHaveProperty('shells');
      expect(resultWithBias.shells).toHaveLength(2);

      const fastShell = resultWithBias.shells.find(s => s.shellId === 'fast');
      const slowShell = resultWithBias.shells.find(s => s.shellId === 'slow');

      // Fast shell should have higher speed parameter
      expect(fastShell.speedParameter).toBeGreaterThan(slowShell.speedParameter);
    });

    test('shell usage tracking: verify shell parameters computed', () => {
      const comparisons = [
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true, shellId1: 'shell1', shellId2: 'shell2' },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true, shellId1: 'shell1', shellId2: 'shell2' },
        { athlete1Id: 'C', athlete2Id: 'D', athlete1Win: true, shellId1: 'shell3', shellId2: 'shell2' },
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: true });

      expect(result).toHaveProperty('shells');
      expect(result.shells).toHaveLength(3);

      result.shells.forEach(shell => {
        expect(shell).toHaveProperty('shellId');
        expect(shell).toHaveProperty('speedParameter');
        expect(shell).toHaveProperty('comparisonsInShell');
        expect(shell.speedParameter).toBeGreaterThan(0);
        expect(shell.comparisonsInShell).toBeGreaterThan(0);
      });
    });

    test('edge case: empty comparisons throws error', () => {
      expect(() => fitBradleyTerryModel([], { includeBoatSpeed: false }))
        .toThrow();
    });

    test('edge case: single athlete returns default', () => {
      const comparisons = [
        { athlete1Id: 'A', athlete2Id: 'A', athlete1Win: true },
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: false });

      expect(result.athletes).toHaveLength(1);
      expect(result.athletes[0].athleteId).toBe('A');
    });

    test('no shell data: skip boat speed estimation, fall back to basic model', () => {
      const comparisons = [
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
        { athlete1Id: 'A', athlete2Id: 'B', athlete1Win: true },
      ];

      const result = fitBradleyTerryModel(comparisons, { includeBoatSpeed: true });

      // Should still work but shells array should be empty
      expect(result.athletes).toHaveLength(2);
      expect(result.shells).toHaveLength(0);
    });
  });

  describe('computeProbabilityMatrix', () => {
    test('computes probability matrix correctly', () => {
      const athletes = [
        { athleteId: 'A', strength: 2.0, stdError: 0.5, ci: [1.5, 2.5] },
        { athleteId: 'B', strength: 1.0, stdError: 0.5, ci: [0.5, 1.5] },
      ];

      const pMatrix = computeProbabilityMatrix(athletes);

      expect(pMatrix).toHaveLength(2);
      expect(pMatrix[0]).toHaveLength(2);

      // P(A beats B) = strength_A / (strength_A + strength_B) = 2 / 3 = 0.667
      expect(pMatrix[0][1]).toBeCloseTo(0.667, 2);

      // P(B beats A) = strength_B / (strength_B + strength_A) = 1 / 3 = 0.333
      expect(pMatrix[1][0]).toBeCloseTo(0.333, 2);

      // Diagonal should be 0.5 (or undefined - athlete vs self)
      expect(pMatrix[0][0]).toBeCloseTo(0.5, 1);
      expect(pMatrix[1][1]).toBeCloseTo(0.5, 1);
    });
  });

  describe('computeStandardErrors', () => {
    test('computes standard errors from hessian', () => {
      // Simple 2x2 hessian matrix (Fisher information)
      const hessian = [
        [10, -5],
        [-5, 10],
      ];

      const solution = [1.0, 0.5];

      const stdErrors = computeStandardErrors(hessian, solution);

      expect(stdErrors).toHaveLength(2);
      stdErrors.forEach(se => {
        expect(se).toBeGreaterThan(0);
        expect(isFinite(se)).toBe(true);
      });
    });
  });
});
