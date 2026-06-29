// Metro skonfigurowany pod monorepo pnpm (watch całego repo + resolucja
// node_modules z workspace). Patrz: docs Expo "Work with monorepos".
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Obserwuj cały monorepo (pakiety współdzielone: @dsw/core, @dsw/api-types).
config.watchFolders = [workspaceRoot];

// 2. Szukaj modułów najpierw lokalnie, potem w katalogu głównym workspace.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Wymuś nieheurystyczne wyszukiwanie (spójne z node-linker=hoisted).
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
