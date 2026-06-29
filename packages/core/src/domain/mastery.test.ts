import { describe, expect, it } from 'vitest';
import {
  computeMastery,
  nextMasteryLevel,
  outcomeToMinLevel,
  type MasteryLevel,
  type TechniqueOutcome,
} from './mastery';

describe('outcomeToMinLevel', () => {
  it('mapuje rezultaty na minimalne poziomy', () => {
    expect(outcomeToMinLevel('learned')).toBe(0);
    expect(outcomeToMinLevel('drilled')).toBe(2);
    expect(outcomeToMinLevel('worked_in_sparring')).toBe(4);
    expect(outcomeToMinLevel('failed')).toBe(0);
  });
});

describe('nextMasteryLevel', () => {
  it('nigdy nie obniża poziomu', () => {
    expect(nextMasteryLevel(4, 'learned')).toBe(4);
    expect(nextMasteryLevel(3, 'failed')).toBe(3);
    expect(nextMasteryLevel(2, 'drilled')).toBe(2);
  });

  it('podnosi poziom, gdy rezultat jest wyższy', () => {
    expect(nextMasteryLevel(0, 'drilled')).toBe(2);
    expect(nextMasteryLevel(2, 'worked_in_sparring')).toBe(4);
  });
});

describe('computeMastery', () => {
  it('jest monotoniczne i niezależne od kolejności (idempotentne na zbiorze)', () => {
    const outcomes: TechniqueOutcome[] = ['learned', 'drilled', 'failed', 'worked_in_sparring'];
    const reversed = [...outcomes].reverse();
    expect(computeMastery(outcomes)).toBe(4);
    expect(computeMastery(reversed)).toBe(4);
  });

  it('startuje od poziomu początkowego i nie schodzi niżej', () => {
    const initial: MasteryLevel = 3;
    expect(computeMastery(['learned', 'failed'], initial)).toBe(3);
  });

  it('pusty zbiór zwraca poziom początkowy', () => {
    expect(computeMastery([])).toBe(0);
    expect(computeMastery([], 2)).toBe(2);
  });
});
