// Składa jeden deploy Netlify: landing (korzeń) + aplikacja pod /app.
// Uruchamiane przez `pnpm web:build` PO zbudowaniu obu aplikacji.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const landingDist = path.join(root, 'apps', 'landing', 'dist');
const appDist = path.join(root, 'apps', 'app', 'dist');
const target = path.join(landingDist, 'app');

if (!existsSync(landingDist)) throw new Error('Brak apps/landing/dist — najpierw zbuduj landing.');
if (!existsSync(appDist)) throw new Error('Brak apps/app/dist — najpierw zbuduj aplikację (expo export).');

rmSync(target, { recursive: true, force: true });
cpSync(appDist, target, { recursive: true });
// _redirects aplikacji nie obowiązuje w podkatalogu — reguły są w landing/public/_redirects
rmSync(path.join(target, '_redirects'), { force: true });

console.log('OK: apps/app/dist → apps/landing/dist/app (publish: apps/landing/dist)');
