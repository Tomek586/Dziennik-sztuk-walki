import type { Tables } from '@dsw/api-types';
import { matchTechnique, normalizeTechnique, type TechniqueAliasRef } from '@dsw/core';
import { supabase } from '@/lib/supabase';
import * as collection from '@/offline/collection';

export type Technique = Tables<'techniques'>;
export type TechniqueAlias = Tables<'technique_aliases'>;
export type TechniqueRelation = Tables<'technique_relations'>;

const T_TECH = 'techniques';
const T_ALIAS = 'technique_aliases';
const T_REL = 'technique_relations';

/** Pobiera słownik (techniki + aliasy + relacje) do lokalnego cache. */
export async function syncTechniqueDictionary(): Promise<void> {
  const [tech, alias, rel] = await Promise.all([
    supabase.from('techniques').select('*'),
    supabase.from('technique_aliases').select('*'),
    supabase.from('technique_relations').select('*'),
  ]);
  if (tech.error) throw new Error(tech.error.message);
  if (tech.data) await collection.upsertMany<Technique>(T_TECH, tech.data);
  if (!alias.error && alias.data) await collection.upsertMany<TechniqueAlias>(T_ALIAS, alias.data);
  if (!rel.error && rel.data) await collection.upsertMany<TechniqueRelation>(T_REL, rel.data);
}

export async function listTechniques(): Promise<Technique[]> {
  const rows = await collection.getAll<Technique>(T_TECH);
  return rows.sort((a, b) => a.name_pl.localeCompare(b.name_pl, 'pl'));
}

export async function getTechnique(id: string): Promise<Technique | undefined> {
  return collection.getById<Technique>(T_TECH, id);
}

/** Odwzorowania aliasów do dopasowywania technik (np. z notatki). */
export async function listAliasRefs(): Promise<TechniqueAliasRef[]> {
  const rows = await collection.getAll<TechniqueAlias>(T_ALIAS);
  return rows.map((a) => ({ techniqueId: a.technique_id, normalized: a.normalized }));
}

/** Wyszukiwanie po nazwie PL/EN, slug-u oraz aliasach (z normalizacją). */
export async function searchTechniques(query: string): Promise<Technique[]> {
  const all = await listTechniques();
  const n = normalizeTechnique(query);
  if (n === '') return all;
  const matchedId = matchTechnique(query, await listAliasRefs()).techniqueId;
  const slugQuery = n.replace(/ /g, '-');
  return all.filter(
    (technique) =>
      normalizeTechnique(technique.name_pl).includes(n) ||
      normalizeTechnique(technique.name_en).includes(n) ||
      technique.slug.includes(slugQuery) ||
      technique.id === matchedId,
  );
}

/** Powiązane techniki (relacje wychodzące od danej techniki). */
export async function getRelations(
  techniqueId: string,
): Promise<{ relation: string; technique: Technique }[]> {
  const [rels, techs] = await Promise.all([
    collection.getAll<TechniqueRelation>(T_REL),
    listTechniques(),
  ]);
  const byId = new Map(techs.map((technique) => [technique.id, technique]));
  const out: { relation: string; technique: Technique }[] = [];
  for (const r of rels) {
    if (r.from_id === techniqueId) {
      const technique = byId.get(r.to_id);
      if (technique) out.push({ relation: r.relation, technique });
    }
  }
  return out;
}
