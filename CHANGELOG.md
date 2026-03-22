# Changelog

## 0.35.4

- Remove type:module from package.json to fix webpack 4 consumers

## 0.35.3

- Cache chart lookups in strategy checkers (~8% simulation speedup)
- Promote `no-non-null-assertion` lint rule to error
- Remove Babel, migrate to native TypeScript compilation
- Migrate ESLint to flat config (v10)
- Update all dev dependencies to latest

## 0.35.2

- Update publish workflow to Node 20
- Update test matrix to Node 20, 22, 24 (drop EOL Node 18)

## 0.35.1

- Add `child` to valid CLI flags for multi-core simulation
- Validate CLI flags and error on unknown options

## 0.35.0

- Multi-core simulation support via `--child` worker flag
