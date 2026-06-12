import { describe, it, expect } from 'vitest';
import { cycleExtractorColor, extractorOutputTarget, extractorHasInputOfColor } from '../ExtractorSystem';
import { buildColorConnectionGraph } from '../WireNetwork';
import { c } from './helpers';

describe('cycleExtractorColor', () => {
  it('cycles red → blue → green → red', () => {
    expect(cycleExtractorColor('red')).toBe('blue');
    expect(cycleExtractorColor('blue')).toBe('green');
    expect(cycleExtractorColor('green')).toBe('red');
  });
});

describe('extractorOutputTarget', () => {
  it('outputs right for rotation 0', () => {
    const extractor = c(1, 'extractor', 1, 1, 1, 1, 0);
    const target = c(2, 'circle', 2, 1);
    expect(extractorOutputTarget(extractor, [extractor, target])?.id).toBe(2);
  });

  it('outputs down for rotation 1', () => {
    const extractor = c(1, 'extractor', 1, 1, 1, 1, 1);
    const target = c(2, 'circle', 1, 2);
    expect(extractorOutputTarget(extractor, [extractor, target])?.id).toBe(2);
  });

  it('outputs left for rotation 2', () => {
    const extractor = c(1, 'extractor', 1, 1, 1, 1, 2);
    const target = c(2, 'circle', 0, 1);
    expect(extractorOutputTarget(extractor, [extractor, target])?.id).toBe(2);
  });

  it('outputs up for rotation 3', () => {
    const extractor = c(1, 'extractor', 1, 1, 1, 1, 3);
    const target = c(2, 'circle', 1, 0);
    expect(extractorOutputTarget(extractor, [extractor, target])?.id).toBe(2);
  });

  it('returns null when output cell is empty', () => {
    const extractor = c(1, 'extractor', 1, 1, 1, 1, 0);
    expect(extractorOutputTarget(extractor, [extractor])).toBeNull();
  });
});

describe('extractorHasInputOfColor', () => {
  it('returns true with direct red source input', () => {
    const components = [
      c(1, 'red', 0, 1),
      c(2, 'extractor', 1, 1, 1, 1, 0, 'red'),
      c(3, 'circle', 2, 1),
    ];
    const graph = buildColorConnectionGraph(components, new Set());
    expect(extractorHasInputOfColor(components[1], components, graph, 'red')).toBe(true);
  });

  it('returns true when input is connected via red-bearing wire', () => {
    const components = [
      c(1, 'red', 0, 1),
      c(2, 'wire', 1, 1),
      c(3, 'extractor', 2, 1, 1, 1, 0, 'red'),
    ];
    const graph = buildColorConnectionGraph(components, new Set());
    expect(extractorHasInputOfColor(components[2], components, graph, 'red')).toBe(true);
  });

  it('returns false when required color source is missing', () => {
    const components = [
      c(1, 'red', 0, 1),
      c(2, 'extractor', 1, 1, 1, 1, 0, 'blue'),
    ];
    const graph = buildColorConnectionGraph(components, new Set());
    expect(extractorHasInputOfColor(components[1], components, graph, 'blue')).toBe(false);
  });

  it('returns false when input cell is empty', () => {
    const components = [
      c(1, 'extractor', 1, 1, 1, 1, 0, 'red'),
    ];
    const graph = buildColorConnectionGraph(components, new Set());
    expect(extractorHasInputOfColor(components[0], components, graph, 'red')).toBe(false);
  });

  it('returns true for green source via mediumWire', () => {
    const components = [
      c(1, 'greenMana', 0, 1, 2, 2),
      c(2, 'mediumWire', 2, 1),
      c(3, 'extractor', 3, 1, 1, 1, 0, 'green'),
    ];
    const graph = buildColorConnectionGraph(components, new Set());
    expect(extractorHasInputOfColor(components[2], components, graph, 'green')).toBe(true);
  });
});
