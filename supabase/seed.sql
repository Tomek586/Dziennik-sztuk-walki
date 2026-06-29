-- =====================================================================
-- seed — dane startowe (Etap 0): dyscypliny
-- Idempotentne: ponowne uruchomienie nie tworzy duplikatów.
-- =====================================================================

insert into public.disciplines (code, name_pl, name_en, is_grappling) values
  ('BJJ', 'Brazylijskie jiu-jitsu / grappling', 'Brazilian Jiu-Jitsu / Grappling', true),
  ('MMA', 'Mieszane sztuki walki',               'Mixed Martial Arts',              true),
  ('BOX', 'Boks',                                 'Boxing',                          false),
  ('MT',  'Muay thai',                            'Muay Thai',                       false),
  ('KB',  'Kickboxing',                           'Kickboxing',                      false)
on conflict (code) do nothing;
