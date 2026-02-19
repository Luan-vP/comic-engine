import { describe, it, expect } from 'vitest';

// generatePageTemplate is not exported from the plugin, so we reconstruct its logic by
// verifying the output of the full plugin's POST handler is hard to do in
// a unit test.  Instead, we test the grouping logic inline here by calling
// the factory and inspecting the string output.

// Because generatePageTemplate is not exported we inline a tiny version of
// the grouping logic to test it in isolation.

function groupLayersById(layers) {
  const map = new Map();
  for (const layer of layers) {
    const gid = layer.groupId || '__ungrouped__';
    if (!map.has(gid)) map.set(gid, []);
    map.get(gid).push(layer);
  }
  return map;
}

function namedGroups(map) {
  return [...map.keys()].filter((k) => k !== '__ungrouped__' && k !== 'initial');
}

describe('layer grouping logic', () => {
  it('all layers with groupId initial → no named groups', () => {
    const layers = [
      { index: 0, groupId: 'initial', position: [0, 0, 0] },
      { index: 1, groupId: 'initial', position: [0, 0, -100] },
    ];
    const map = groupLayersById(layers);
    expect(namedGroups(map)).toHaveLength(0);
  });

  it('layers with a named groupId → one named group', () => {
    const layers = [
      { index: 0, groupId: 'initial', position: [0, 0, 0] },
      { index: 1, groupId: 'export-123', position: [0, 0, -100] },
      { index: 2, groupId: 'export-123', position: [0, 0, -200] },
    ];
    const map = groupLayersById(layers);
    expect(namedGroups(map)).toHaveLength(1);
    expect(namedGroups(map)[0]).toBe('export-123');
    expect(map.get('export-123')).toHaveLength(2);
  });

  it('layers without groupId fall into __ungrouped__', () => {
    const layers = [{ index: 0, position: [0, 0, 0] }];
    const map = groupLayersById(layers);
    expect(namedGroups(map)).toHaveLength(0);
    expect(map.get('__ungrouped__')).toHaveLength(1);
  });

  it('multiple distinct named groups', () => {
    const layers = [
      { index: 0, groupId: 'export-aaa', position: [0, 0, 0] },
      { index: 1, groupId: 'export-bbb', position: [0, 0, -100] },
    ];
    const map = groupLayersById(layers);
    expect(namedGroups(map)).toHaveLength(2);
  });
});

describe('z-range computation for groups', () => {
  it('computes correct far/near from layer positions', () => {
    const layers = [
      { index: 0, position: [0, 0, -400] },
      { index: 1, position: [0, 0, -100] },
      { index: 2, position: [0, 0, -250] },
    ];
    const zValues = layers.map((l) => l.position[2]);
    expect(Math.min(...zValues)).toBe(-400);
    expect(Math.max(...zValues)).toBe(-100);
  });
});
