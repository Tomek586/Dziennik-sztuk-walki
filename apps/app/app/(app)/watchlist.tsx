import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Card, H1, Muted, P, Screen } from '@/components/ui';
import { listWatchlist } from '@/features/techniques/user-content';
import { listTechniques, type Technique } from '@/features/techniques/repository';

export default function Watchlist() {
  const [items, setItems] = useState<Technique[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [watch, techs] = await Promise.all([listWatchlist(), listTechniques()]);
        const byId = new Map(techs.map((t) => [t.id, t]));
        setItems(
          watch
            .map((x) => byId.get(x.technique_id))
            .filter((t): t is Technique => t !== undefined),
        );
      })();
    }, []),
  );

  return (
    <Screen>
      <H1>Do nauki</H1>
      {items.length === 0 ? (
        <Muted>Pusto. Oznacz techniki „Dodaj do nauki" na ich stronie.</Muted>
      ) : (
        items.map((t) => (
          <Link key={t.id} href={`/techniques/${t.id}`} asChild>
            <Pressable>
              <Card>
                <P>{t.name_pl}</P>
                <Muted>{t.name_en}</Muted>
              </Card>
            </Pressable>
          </Link>
        ))
      )}
    </Screen>
  );
}
