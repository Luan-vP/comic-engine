import { describe, it, expect } from 'vitest';
import {
  fixedStepArrangement,
  fillRangeArrangement,
  depthProportionalArrangement,
} from '../pipeline.js';

describe('fixedStepArrangement', () => {
  it('returns evenly spaced positions starting from default start', () => {
    expect(fixedStepArrangement(3)).toEqual([-400, -350, -300]);
  });

  it('accepts depths in opts without breaking', () => {
    const depths = [0.1, 0.5, 0.9];
    expect(fixedStepArrangement(3, { depths })).toEqual([-400, -350, -300]);
  });
});

describe('fillRangeArrangement', () => {
  it('fills the entire z-range evenly', () => {
    expect(fillRangeArrangement(3)).toEqual([-400, -100, 200]);
  });

  it('returns [far] for count <= 1', () => {
    expect(fillRangeArrangement(1)).toEqual([-400]);
    expect(fillRangeArrangement(0)).toEqual([-400]);
  });

  it('accepts depths in opts without breaking', () => {
    const depths = [0.1, 0.5, 0.9];
    expect(fillRangeArrangement(3, { depths })).toEqual([-400, -100, 200]);
  });
});

describe('depthProportionalArrangement', () => {
  it('maps evenly-spread depths to full z-range', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0, 0.5, 1],
      far: -400,
      near: 200,
    });
    expect(result).toEqual([-400, -100, 200]);
  });

  it('maps uneven depths proportionally', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0.1, 0.5, 0.9],
      far: -400,
      near: 200,
    });
    // z = far + depth * (near - far) = -400 + depth * 600
    // depth=0.1 → -400 + 60 = -340
    // depth=0.5 → -400 + 300 = -100
    // depth=0.9 → -400 + 540 = 140
    expect(result).toEqual([-340, -100, 140]);
  });

  it('maps depth=0 to far and depth=1 to near', () => {
    const result = depthProportionalArrangement(2, {
      depths: [0, 1],
      far: -400,
      near: 200,
    });
    expect(result).toEqual([-400, 200]);
  });

  it('returns [] for count=0', () => {
    expect(depthProportionalArrangement(0, { depths: [], far: -400, near: 200 })).toEqual([]);
  });

  it('returns [far] for a single layer at depth=0', () => {
    const result = depthProportionalArrangement(1, { depths: [0], far: -400, near: 200 });
    expect(result).toEqual([-400]);
  });

  it('returns [near] for a single layer at depth=1', () => {
    const result = depthProportionalArrangement(1, { depths: [1], far: -400, near: 200 });
    expect(result).toEqual([200]);
  });

  it('places all layers at same z when all depths are equal', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0.5, 0.5, 0.5],
      far: -400,
      near: 200,
    });
    expect(result).toEqual([-100, -100, -100]);
  });

  it('falls back to fillRangeArrangement when depths is not provided', () => {
    const result = depthProportionalArrangement(3, { far: -400, near: 200 });
    expect(result).toEqual([-400, -100, 200]);
  });

  it('falls back to fillRangeArrangement when depths length does not match count', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0.1, 0.9],
      far: -400,
      near: 200,
    });
    expect(result).toEqual([-400, -100, 200]);
  });

  it('uses default far=-400 and near=200 when not specified', () => {
    const result = depthProportionalArrangement(2, { depths: [0, 1] });
    expect(result).toEqual([-400, 200]);
  });

  it('works with custom far and near values', () => {
    const result = depthProportionalArrangement(3, {
      depths: [0, 0.5, 1],
      far: -100,
      near: 100,
    });
    expect(result).toEqual([-100, 0, 100]);
  });
});
