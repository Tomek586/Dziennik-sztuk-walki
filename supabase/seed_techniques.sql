-- =====================================================================
-- seed_techniques — startowy słownik technik + aliasy + relacje (Etap 1)
-- Idempotentne. Uruchom PO 0003_techniques.sql.
-- normalized w aliasach wylicza się automatycznie (kolumna generowana).
-- =====================================================================

-- skróty do id dyscyplin
-- (używamy podzapytań po code, więc seed jest niezależny od konkretnych uuid)

-- ---------------------------------------------------------------------
-- TECHNIKI
-- ---------------------------------------------------------------------
insert into public.techniques (discipline_id, name_pl, name_en, slug, category, position, gi_context) values
  -- BJJ / grappling
  ((select id from public.disciplines where code='BJJ'), 'duszenie zza pleców',          'rear naked choke',      'rear-naked-choke',   'duszenie',  'plecy',  'both'),
  ((select id from public.disciplines where code='BJJ'), 'trójkąt',                       'triangle choke',        'triangle-choke',     'duszenie',  'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'gilotyna',                      'guillotine',            'guillotine',         'duszenie',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'dźwignia na ramię z krzyża',    'armbar',                'armbar',             'dzwignia',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'kimura',                        'kimura',                'kimura',             'dzwignia',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'americana',                     'americana',             'americana',          'dzwignia',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'omoplata',                      'omoplata',              'omoplata',           'dzwignia',  'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'dźwignia na piętę',             'heel hook',             'heel-hook',          'dzwignia',  'nogi',   'no-gi'),
  ((select id from public.disciplines where code='BJJ'), 'dźwignia na kolano',            'kneebar',               'kneebar',            'dzwignia',  'nogi',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'dosiad',                        'mount',                 'mount',              'pozycja',   'mount',  'both'),
  ((select id from public.disciplines where code='BJJ'), 'plecy',                         'back control',          'back-control',       'pozycja',   'plecy',  'both'),
  ((select id from public.disciplines where code='BJJ'), 'boczne trzymanie',              'side control',          'side-control',       'pozycja',   null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'zamknięta garda',               'closed guard',          'closed-guard',       'gard',      'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'półgarda',                      'half guard',            'half-guard',         'gard',      'gard',   'both'),
  ((select id from public.disciplines where code='BJJ'), 'sprowadzenie oburącz',          'double leg takedown',   'double-leg',         'obalenie',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'sprowadzenie jednonóż',         'single leg takedown',   'single-leg',         'obalenie',  null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'sprawl',                        'sprawl',                'sprawl',             'obrona',    null,     'both'),
  ((select id from public.disciplines where code='BJJ'), 'przejście gardy toreando',      'toreando pass',         'toreando-pass',      'przejscie', null,     'both'),
  -- sporty uderzane (BOX / MT / KB)
  ((select id from public.disciplines where code='BOX'), 'lewy prosty',                   'jab',                   'jab',                'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='BOX'), 'prawy prosty',                  'cross',                 'cross',              'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='BOX'), 'sierpowy',                      'hook',                  'hook',               'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='BOX'), 'podbródkowy',                   'uppercut',              'uppercut',           'uderzenie', null,     'n/a'),
  ((select id from public.disciplines where code='MT'),  'low kick',                      'low kick',              'low-kick',           'kopniecie', null,     'n/a'),
  ((select id from public.disciplines where code='MT'),  'kopnięcie frontalne',           'teep',                  'teep',               'kopniecie', null,     'n/a'),
  ((select id from public.disciplines where code='MT'),  'kopnięcie okrężne',             'roundhouse kick',       'roundhouse-kick',    'kopniecie', null,     'n/a'),
  -- MMA
  ((select id from public.disciplines where code='MMA'), 'uderzenia w parterze',          'ground and pound',      'ground-and-pound',   'uderzenie', 'parter', 'n/a')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- ALIASY (slang, skróty, warianty zapisu). normalized liczy się sam.
-- ---------------------------------------------------------------------
insert into public.technique_aliases (technique_id, alias, lang) values
  ((select id from public.techniques where slug='rear-naked-choke'), 'duszenie zza pleców', 'pl'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'duszenie zza plecow', 'pl'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'duszenie z plecow',   'pl'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'RNC',                 'en'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'rear naked choke',    'en'),
  ((select id from public.techniques where slug='rear-naked-choke'), 'mata leão',           'other'),
  ((select id from public.techniques where slug='triangle-choke'),   'trójkąt',             'pl'),
  ((select id from public.techniques where slug='triangle-choke'),   'trojkat',             'pl'),
  ((select id from public.techniques where slug='triangle-choke'),   'triangle',            'en'),
  ((select id from public.techniques where slug='guillotine'),       'gilotyna',            'pl'),
  ((select id from public.techniques where slug='guillotine'),       'guillotine',          'en'),
  ((select id from public.techniques where slug='armbar'),           'dźwignia na ramię',   'pl'),
  ((select id from public.techniques where slug='armbar'),           'armbar',              'en'),
  ((select id from public.techniques where slug='armbar'),           'juji gatame',         'other'),
  ((select id from public.techniques where slug='kimura'),           'kimura',              'en'),
  ((select id from public.techniques where slug='americana'),        'americana',           'en'),
  ((select id from public.techniques where slug='americana'),        'keylock',             'en'),
  ((select id from public.techniques where slug='omoplata'),         'omoplata',            'other'),
  ((select id from public.techniques where slug='heel-hook'),        'dźwignia na piętę',   'pl'),
  ((select id from public.techniques where slug='heel-hook'),        'heel hook',           'en'),
  ((select id from public.techniques where slug='mount'),            'dosiad',              'pl'),
  ((select id from public.techniques where slug='mount'),            'mount',               'en'),
  ((select id from public.techniques where slug='back-control'),     'plecy',               'pl'),
  ((select id from public.techniques where slug='back-control'),     'back control',        'en'),
  ((select id from public.techniques where slug='back-control'),     'back',                'en'),
  ((select id from public.techniques where slug='side-control'),     'boczne trzymanie',    'pl'),
  ((select id from public.techniques where slug='side-control'),     'side control',        'en'),
  ((select id from public.techniques where slug='closed-guard'),     'zamknięta garda',     'pl'),
  ((select id from public.techniques where slug='closed-guard'),     'closed guard',        'en'),
  ((select id from public.techniques where slug='half-guard'),       'półgarda',            'pl'),
  ((select id from public.techniques where slug='half-guard'),       'half guard',          'en'),
  ((select id from public.techniques where slug='double-leg'),       'sprowadzenie oburącz','pl'),
  ((select id from public.techniques where slug='double-leg'),       'double leg',          'en'),
  ((select id from public.techniques where slug='single-leg'),       'sprowadzenie jednonóż','pl'),
  ((select id from public.techniques where slug='single-leg'),       'single leg',          'en'),
  ((select id from public.techniques where slug='toreando-pass'),    'toreando',            'other'),
  ((select id from public.techniques where slug='jab'),              'lewy prosty',         'pl'),
  ((select id from public.techniques where slug='jab'),              'jab',                 'en'),
  ((select id from public.techniques where slug='cross'),            'prawy prosty',        'pl'),
  ((select id from public.techniques where slug='cross'),            'cross',               'en'),
  ((select id from public.techniques where slug='hook'),             'sierpowy',            'pl'),
  ((select id from public.techniques where slug='hook'),             'hook',                'en'),
  ((select id from public.techniques where slug='uppercut'),         'podbródkowy',         'pl'),
  ((select id from public.techniques where slug='uppercut'),         'uppercut',            'en'),
  ((select id from public.techniques where slug='low-kick'),         'low kick',            'en'),
  ((select id from public.techniques where slug='low-kick'),         'lowik',               'pl'),
  ((select id from public.techniques where slug='teep'),             'teep',                'en'),
  ((select id from public.techniques where slug='teep'),             'push kick',           'en'),
  ((select id from public.techniques where slug='roundhouse-kick'),  'kopnięcie okrężne',   'pl'),
  ((select id from public.techniques where slug='roundhouse-kick'),  'roundhouse',          'en'),
  ((select id from public.techniques where slug='ground-and-pound'), 'ground and pound',    'en'),
  ((select id from public.techniques where slug='ground-and-pound'), 'gnp',                 'en')
on conflict (technique_id, alias) do nothing;

-- ---------------------------------------------------------------------
-- RELACJE (przykładowe powiązania)
-- ---------------------------------------------------------------------
insert into public.technique_relations (from_id, to_id, relation) values
  ((select id from public.techniques where slug='mount'),        (select id from public.techniques where slug='back-control'),     'transition_to'),
  ((select id from public.techniques where slug='back-control'), (select id from public.techniques where slug='rear-naked-choke'), 'setup_for'),
  ((select id from public.techniques where slug='closed-guard'), (select id from public.techniques where slug='triangle-choke'),   'setup_for'),
  ((select id from public.techniques where slug='closed-guard'), (select id from public.techniques where slug='armbar'),           'setup_for'),
  ((select id from public.techniques where slug='sprawl'),       (select id from public.techniques where slug='double-leg'),       'counter_to'),
  ((select id from public.techniques where slug='mount'),        (select id from public.techniques where slug='armbar'),           'setup_for')
on conflict (from_id, to_id, relation) do nothing;
