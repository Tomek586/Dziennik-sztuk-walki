-- =====================================================================
-- 0007 — aliasy technik prywatnych użytkownika
-- Techniki prywatne (is_official=false, created_by) istnieją od 0003;
-- brakowało polityki INSERT na aliasy, przez co własna technika nie
-- była potem dopasowywana w notatkach głosowych.
-- =====================================================================

-- właściciel techniki prywatnej może dodawać jej aliasy
create policy "technique_aliases_insert_own"
  on public.technique_aliases for insert to authenticated
  with check (
    exists (
      select 1 from public.techniques t
      where t.id = technique_id
        and t.created_by = auth.uid()
        and not t.is_official
    )
  );

-- aliasy technik prywatnych widzi tylko właściciel (globalne — wszyscy)
drop policy "technique_aliases_select" on public.technique_aliases;
create policy "technique_aliases_select"
  on public.technique_aliases for select to authenticated
  using (
    exists (
      select 1 from public.techniques t
      where t.id = technique_id
        and (t.is_official or t.created_by = auth.uid())
    )
  );
