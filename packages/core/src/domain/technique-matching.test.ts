import { describe, expect, it } from 'vitest';
import {
  matchTechnique,
  normalizeTechnique,
  type TechniqueAliasRef,
} from './technique-matching';

describe('normalizeTechnique', () => {
  it('usuwa polskie znaki diakrytyczne i sprowadza do małych liter', () => {
    expect(normalizeTechnique('Duszenie zza pleców')).toBe('duszenie zza plecow');
    expect(normalizeTechnique('Trójkąt')).toBe('trojkat');
    expect(normalizeTechnique('półgarda')).toBe('polgarda');
  });

  it('obsługuje skróty, interpunkcję i nadmiarowe spacje', () => {
    expect(normalizeTechnique('  R.N.C.  ')).toBe('r n c');
    expect(normalizeTechnique('back  control')).toBe('back control');
  });

  it('zdejmuje akcenty spoza polskiego (np. portugalskie)', () => {
    expect(normalizeTechnique('mata leão')).toBe('mata leao');
  });

  it('pusty/biały tekst daje pusty łańcuch', () => {
    expect(normalizeTechnique('   ')).toBe('');
    expect(normalizeTechnique('')).toBe('');
  });
});

describe('matchTechnique', () => {
  const aliases: TechniqueAliasRef[] = [
    { techniqueId: 'rnc', normalized: 'duszenie zza plecow' },
    { techniqueId: 'rnc', normalized: 'rnc' },
    { techniqueId: 'rnc', normalized: 'rear naked choke' },
    { techniqueId: 'tri', normalized: 'trojkat' },
    { techniqueId: 'tri', normalized: 'triangle' },
  ];

  it('dopasowuje dokładnie po znormalizowanym aliasie (z polskimi znakami w wejściu)', () => {
    const m = matchTechnique('duszenie zza pleców', aliases);
    expect(m).toEqual({ techniqueId: 'rnc', kind: 'exact', confidence: 1 });
  });

  it('dopasowuje skrót', () => {
    expect(matchTechnique('RNC', aliases).techniqueId).toBe('rnc');
  });

  it('dopasowanie rozmyte, gdy wejście zawiera alias', () => {
    const m = matchTechnique('zrobiłem triangle z gardy', aliases);
    expect(m.techniqueId).toBe('tri');
    expect(m.kind).toBe('fuzzy');
  });

  it('zwraca brak dopasowania dla nieznanej techniki', () => {
    expect(matchTechnique('berimbolo', aliases)).toEqual({
      techniqueId: null,
      kind: 'none',
      confidence: 0,
    });
  });
});
