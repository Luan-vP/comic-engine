import { describe, it, expect } from 'vitest';
import {
  fixedStepArrangement,
  fillRangeArrangement,
  depthProportionalArrangement,
} from '../pipeline.js';

describe('fixedStepArrangement', () => {
  it('returns evenly spaced positions from start', () => {
    expect(fixedStepArrangement(3)).toEqual([-400, -350, -300]);
  });

  it('accepts custom start and step', () => {
    expect(fixedStepArrangement(3, { start: 0, step: 100 })).toEqual([0, 100, 200]);
  });

  it('ignores unknown options (e.g. depths)', () => {
    expect(fixedStepArrangement(3, { depths: [0.1, 0.5, 0.9] })).toEqual([-400, -350, -300]);
  });

  it('handles count of 1', () => {
    expect(fixedStepArrangement(1)).toEqual([-400]);
  });

  it('handles count of 0', () => {
    expect(fixedStepArrangement(0)).toEqual([]);
  });
});

describe('fillRangeArrangement', () => {
  it('fills range evenly with 3 layers', () => {
    expect(fillRangeArrangement(3)).toEqual([-400, -100, 200]);
  });

  it('returns [far] for count of 1', () => {
    expect(fillRangeArrangement(1)).toEqual([-400]);
  });

  it('accepts custom far and near', () => {
    expect(fillRangeArrangement(3, { far: 0, near: 100 })).toEqual([0, 50, 100]);
  });

  it('ignores unknown options (e.g. depths)', () => {
    expect(fillRangeArrangement(3, { depths: [0.1, 0.5, 0.9] })).toEqual([-400, -100, 200]);
  });
});

describe('depthProportionalArrangement', () => {
  it('maps depths proportionally: [0, 0.5, 1] → [-400, -100, 200]', () => {
    const result = depthProportionalArrangement(3, { depths: [0, 0.5, 1] });
    expect(result).toEqual([-400, -100, 200]);
  });

  it('maps uneven depths proportionally: [0.1, 0.5, 0.9]', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0.1, 0.5, 0.9],
      far: -400,
      near: 200,
    });
    expect(result).toEqual([-340, -100, 140]);
  });

  it('handles single layer', () => {
    const result = depthProportionalArrangement(1, { depths: [0.5] });
    expect(result).toEqual([-100]);
  });

  it('handles single layer with depth 0', () => {
    const result = depthProportionalArrangement(1, { depths: [0] });
    expect(result).toEqual([-400]);
  });

  it('handles count of 0', () => {
    expect(depthProportionalArrangement(0, { depths: [] })).toEqual([]);
  });

  it('falls back to even spacing when depths not provided', () => {
    const result = depthProportionalArrangement(3);
    expect(result).toEqual([-400, -100, 200]);
  });

  it('falls back to even spacing when depths length does not match count', () => {
    const result = depthProportionalArrangement(3, { depths: [0.5] });
    expect(result).toEqual([-400, -100, 200]);
  });

  it('accepts custom far and near', () => {
    const result = depthProportionalArrangement(2, { depths: [0, 1], far: 0, near: 100 });
    expect(result).toEqual([0, 100]);
  });

  it('maps all-same depths to the same z position', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0.5, 0.5, 0.5],
      far: -400,
      near: 200,
    });
    expect(result).toEqual([-100, -100, -100]);
  });

  it('depth=0 maps to far, depth=1 maps to near', () => {
    const result = depthProportionalArrangement(2, {
      depths: [0, 1],
      far: -400,
      near: 200,
    });
    expect(result[0]).toBe(-400);
    expect(result[1]).toBe(200);
  });

  it('layers with larger depth gap produce proportionally larger z gap', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0.1, 0.5, 0.9],
      far: -400,
      near: 200,
    });
    const gap1 = result[1] - result[0]; // 0.4 depth gap
    const gap2 = result[2] - result[1]; // 0.4 depth gap
    expect(gap1).toBeCloseTo(gap2);
  });
});
