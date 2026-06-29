import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { OUTCOME_LABELS_PL, TECHNIQUE_OUTCOMES, type TechniqueOutcome } from '@dsw/core';
import { Chip, Muted, P, TextField } from '@/components/ui';
import { useTheme } from '@/theme';
import { listTechniques, searchTechniques, type Technique } from '@/features/techniques/repository';

export interface PickedTechnique {
  technique: Technique;
  outcome: TechniqueOutcome | null;
}

export function TechniquePicker({
  value,
  onChange,
}: {
  value: PickedTechnique[];
  onChange: (next: PickedTechnique[]) => void;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Technique[]>([]);
  const [hasDictionary, setHasDictionary] = useState(true);

  useEffect(() => {
    let active = true;
    listTechniques().then((list) => {
      if (active) setHasDictionary(list.length > 0);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedIds = useMemo(() => new Set(value.map((p) => p.technique.id)), [value]);

  const runSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      if (q.trim() === '') {
        setResults([]);
        return;
      }
      const found = await searchTechniques(q);
      setResults(found.filter((x) => !selectedIds.has(x.id)).slice(0, 8));
    },
    [selectedIds],
  );

  const add = (technique: Technique) => {
    onChange([...value, { technique, outcome: null }]);
    setQuery('');
    setResults([]);
  };
  const remove = (id: string) => onChange(value.filter((p) => p.technique.id !== id));
  const setOutcome = (id: string, outcome: TechniqueOutcome) =>
    onChange(
      value.map((p) =>
        p.technique.id === id
          ? { ...p, outcome: p.outcome === outcome ? null : outcome }
          : p,
      ),
    );

  return (
    <View style={{ gap: 10 }}>
      <Muted>Techniki na treningu (opcjonalnie)</Muted>
      {!hasDictionary && (
        <Muted>Słownik technik nie został jeszcze pobrany — połącz się raz z internetem.</Muted>
      )}
      <TextField
        label="Dodaj technikę"
        value={query}
        onChangeText={runSearch}
        placeholder="szukaj: duszenie, RNC, low kick…"
        autoCapitalize="none"
      />
      {results.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {results.map((r) => (
            <Chip key={r.id} label={`+ ${r.name_pl}`} selected={false} onPress={() => add(r)} />
          ))}
        </View>
      )}

      {value.map((p) => (
        <View
          key={p.technique.id}
          style={{
            backgroundColor: t.card,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <P>{p.technique.name_pl}</P>
            <Pressable onPress={() => remove(p.technique.id)} hitSlop={8}>
              <Muted>usuń ✕</Muted>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {TECHNIQUE_OUTCOMES.map((o) => (
              <Chip
                key={o}
                label={OUTCOME_LABELS_PL[o]}
                selected={p.outcome === o}
                onPress={() => setOutcome(p.technique.id, o)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
