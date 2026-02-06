# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2026-02-06

### Added

First stable release. Lightweight internationalization (i18n) library compatible with Deno, Bun, Node.js, and browsers. Pure JavaScript, no external dependencies.

#### Translation

- **Multi-language**: Support for any number of locales
- **Nested keys**: Dot-separated keys (e.g. `nav.home`)
- **Interpolation**: `{name}` placeholder replacement
- **Fallback**: Fall back to default locale when key is missing
- **Fallback behavior**: Configurable via `fallbackBehavior` (`key`, `empty`, `default`)

#### Formatting

- **Number formatting**: `formatNumber()` with thousands separator, decimal places
- **Currency formatting**: `formatCurrency()` with auto symbol by locale or custom symbol
- **Date formatting**: `formatDate()` for date, time, datetime, and custom formats
- **Relative time**: `formatRelative()` for "just now", "5 minutes ago", etc.

#### Language Management

- **Locale switch**: `setLocale()`, `getLocale()`, `getLocales()`
- **Support check**: `isLocaleSupported()`
- **Auto-detect**: `detectLocale()` from browser/system preferences, `autoDetect` option
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

- **Bundle cache**: `persistentCache` config for caching loaded translation bundles
- **Storage**: `localStorage` or `sessionStorage`
- **TTL**: Configurable expiration (default 7 days)
- **LRU eviction**: `maxEntries` for bundle URL count
- **Two-tier cache**: Memory + persistent, `clearPersistentCache()`

#### Security

- **XSS protection**: `escapeHtml` option to escape HTML in params
- **Prototype pollution**: `loadTranslations` filters dangerous keys (`__proto__`, `constructor`, `prototype`)

#### Factory & Singleton

- **createI18n()**: Factory function for I18n instance
- **getI18n()**: Get singleton instance
- **setDefaultI18n()**: Set default instance

#### Type Exports

- `I18nService`, `TranslationParams`, `TranslationData`
- `createI18n`, `getI18n`, `setDefaultI18n`, `$t`, `$i18n`
