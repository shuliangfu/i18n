# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.2] - 2026-07-22

### Fixed

- **`formatRelative` future-time test flakiness on Windows CI**: the test
  `未来时间应该使用'后'` used `Date.now() + 5 * 60 * 1000` (exact 5-minute
  boundary). `formatRelative` computes `Math.floor(absDiff / MINUTE)`, so any
  tick of delay between timestamp creation and the internal `Date.now()` call
  made `absDiff` 299999ms → floored to 4 minutes → "4 分钟后" instead of "5
  分钟后". Added a 30-second buffer (`(5 * 60 + 30) * 1000`) so the test is
  deterministic across all CI runners.

---

## [1.1.1] - 2026-07-22

### Changed

- **`@dreamer/test`**: bumped `^1.2.1` → `^1.2.3` (deno.json + package.json) to
  pick up test 1.2.3's `--test-force-exit` fix and runtime-adapter 1.2.2
  integration.
- **CI: Deno `v2.5` → `v2.9`** (3 occurrences): aligns with the local dev
  environment and other @dreamer packages.

### Fixed

- **`test:node` Linux CI exit code 1**: added `--test-force-exit` to the
  `test:node` script to force clean exit after tests (matching @dreamer/test and
  runtime-adapter patterns).

---

## [1.1.0] - 2026-07-22

### Added

- **Node.js compatibility**: First-class Node.js (>=22) support alongside Deno,
  Bun, and browsers.
  - `package.json` with `test:node` script (`tsx --test`) and
    `engines.node>=22`.
  - `tsconfig.json` for the tsx TypeScript loader.
  - `.npmrc` pointing the `@jsr` scope to JSR's npm-compatible registry so
    `npm`/`bun` can resolve `@dreamer/test`.
  - Three-runtime CI workflow (Deno / Bun / Node × Linux / macOS / Windows).

### Changed

- **detectLocale()**: Server-side locale detection now reads `process.env`
  (`LC_ALL` / `LANG` / `LANGUAGE`) on Node and Bun, in addition to the existing
  `Deno.env` path. i18n cannot depend on `runtime-adapter` (runtime-adapter
  depends on i18n), so env access is direct per runtime global — no new runtime
  dependency.
- **Dependencies**: `@dreamer/test` bumped `^1.0.10` → `^1.2.0` (Node-compatible
  test runner).

### Performance

- **t()**: Cache key computed once instead of twice — `getCacheKey()` (which
  runs `JSON.stringify` on params) no longer runs twice on the hot path.
  Translation lookup extracted into `resolveTranslation()`, removing the
  duplicated lookup/interpolate/cache-write blocks.
- **formatNumber()**: Thousands-separator regex hoisted to a precompiled module
  constant (`THOUSANDS_REGEX`) instead of being recompiled on every call.
- **interpolate()**: Removed dead `INTERPOLATION_REGEX.lastIndex = 0`;
  `String.replace` ignores `lastIndex` for global regexes.

### Security

- **loadTranslationsAsync()**: Response body is now validated at runtime to be a
  non-null object (rejects arrays/strings/null/numbers) before entering the
  translation pipeline, preventing crashes in `getNestedValue`/`mergeDeep` from
  malformed JSON.
- **getStorage()**: Now checks the actually-configured storage (`localStorage`
  vs `sessionStorage`) and guards against access throws in privacy modes,
  instead of only checking `localStorage` existence.

### Refactor

- **$i18n proxy**: The 200+ line hand-written delegation boilerplate in `mod.ts`
  is replaced by a single `Proxy` that resolves the target instance
  (`globalThis.$i18n ?? getI18n()`) and binds methods. Behavior-equivalent, far
  less duplication.

### Documentation

- CHANGELOG / TEST_REPORT (en/zh) refreshed with three-runtime (Deno/Bun/Node)
  results.

---

## [1.0.1] - 2026-02-17

### Added

- **TranslationParams**: Type now accepts `boolean`; interpolation converts
  values to `"true"` / `"false"` for placeholder replacement.

### Changed

- **License**: Updated to Apache 2.0.

### Documentation

- Docs reorganized into `docs/en-US` and `docs/zh-CN` (README, CHANGELOG,
  TEST_REPORT by language). Root keeps English README only.

---

## [1.0.0] - 2026-02-06

### Added

First stable release. Lightweight internationalization (i18n) library compatible
with Deno, Bun, Node.js, and browsers. Pure JavaScript, no external
dependencies.

#### Translation

- **Multi-language**: Support for any number of locales
- **Nested keys**: Dot-separated keys (e.g. `nav.home`)
- **Interpolation**: `{name}` placeholder replacement
- **Fallback**: Fall back to default locale when key is missing
- **Fallback behavior**: Configurable via `fallbackBehavior` (`key`, `empty`,
  `default`)

#### Formatting

- **Number formatting**: `formatNumber()` with thousands separator, decimal
  places
- **Currency formatting**: `formatCurrency()` with auto symbol by locale or
  custom symbol
- **Date formatting**: `formatDate()` for date, time, datetime, and custom
  formats
- **Relative time**: `formatRelative()` for "just now", "5 minutes ago", etc.

#### Language Management

- **Locale switch**: `setLocale()`, `getLocale()`, `getLocales()`
- **Support check**: `isLocaleSupported()`
- **Auto-detect**: `detectLocale()` from browser/system preferences,
  `autoDetect` option
- **Dynamic loading**: `loadTranslations()` for merging translation data
- **Async loading**: `loadTranslationsAsync()` for loading from URL

#### Event System

- **Locale change listener**: `onChange()` with unsubscribe
- **Remove listeners**: `removeAllListeners()`

#### Global Access

- **Install/uninstall**: `install()` and `uninstall()` for global registration
- **Convenience exports**: `$t` and `$i18n` for direct import
- **Global methods**: `$t()` and `$i18n` available on `globalThis` after install

#### Performance

- **Translation cache**: `enableCache`, `cacheMaxSize`, `clearCache()`
- **LRU cache**: Limit cache size, evict least recently used
- **Key path cache**: Cache nested key resolution

#### Persistent Cache

- **Bundle cache**: `persistentCache` config for caching loaded translation
  bundles
- **Storage**: `localStorage` or `sessionStorage`
- **TTL**: Configurable expiration (default 7 days)
- **LRU eviction**: `maxEntries` for bundle URL count
- **Two-tier cache**: Memory + persistent, `clearPersistentCache()`

#### Security

- **XSS protection**: `escapeHtml` option to escape HTML in params
- **Prototype pollution**: `loadTranslations` filters dangerous keys
  (`__proto__`, `constructor`, `prototype`)

#### Factory & Singleton

- **createI18n()**: Factory function for I18n instance
- **getI18n()**: Get singleton instance
- **setDefaultI18n()**: Set default instance

#### Type Exports

- `I18nService`, `TranslationParams`, `TranslationData`
- `createI18n`, `getI18n`, `setDefaultI18n`, `$t`, `$i18n`
