# @dreamer/i18n

> Lightweight internationalization (i18n) library with translation, formatting,
> and multi-language support.

English | [中文 (Chinese)](./docs/zh-CN/README.md)

[![JSR](https://jsr.io/badges/@dreamer/i18n)](https://jsr.io/@dreamer/i18n)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-71%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

---

## 🎯 Features

Lightweight i18n library with full multi-language support. No external
dependencies, pure JavaScript, works in browser and server.

---

## 📦 Installation

### Deno

```bash
deno add jsr:@dreamer/i18n
```

### Bun

```bash
bunx jsr add @dreamer/i18n
```

---

## 🌍 Compatibility

| Environment | Version | Status             |
| ----------- | ------- | ------------------ |
| **Deno**    | 2.0+    | ✅ Fully supported |
| **Bun**     | 1.0+    | ✅ Fully supported |
| **Browser** | ES2020+ | ✅ Fully supported |
| **Node.js** | 18+     | ✅ Fully supported |

---

## ✨ Highlights

### Translation

- **Multi-language**: Any number of locales
- **Nested keys**: Dot-separated keys (e.g. `nav.home`)
- **Interpolation**: `{name}` placeholders
- **Fallback**: Fall back to default locale when key is missing

### Formatting

- **Numbers**: Thousands separator, decimal places
- **Currency**: Auto currency symbol by locale
- **Dates**: Date, time, datetime formats
- **Relative time**: "just now", "5 minutes ago", etc.

### Language Management

- **Locale switch**: Dynamic locale change
- **Support check**: Check if locale is supported
- **Auto-detect**: From browser/system preferences
- **Events**: Listen for locale changes
- **Async load**: Load translations from URL

### Performance

- **Translation cache**: Cache results, avoid repeated parsing
- **LRU**: Limit cache size, evict old entries
- **Key path cache**: Cache nested key resolution

### Global Access

- **Global $t**: Use `$t()`after`install()`
- **Global $i18n**: Access i18n service globally
- **Exports**: Import `$t` and `$i18n` directly

---

## 🎯 Use Cases

- Multi-language websites
- i18n for web and mobile apps
- Localized date/time display
- Regional number and currency formatting
- Real-time language switching

---

## 🚀 Quick Start

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({
  defaultLocale: "en-US",
  locales: ["zh-CN", "en-US"],
  translations: {
    "zh-CN": {
      greeting: "你好",
      welcome: "欢迎 {name}",
      nav: { home: "首页", about: "关于" },
    },
    "en-US": {
      greeting: "Hello",
      welcome: "Welcome {name}",
      nav: { home: "Home", about: "About" },
    },
  },
});

console.log(i18n.t("greeting")); // "Hello"
console.log(i18n.t("welcome", { name: "Alice" })); // "Welcome Alice"
console.log(i18n.t("nav.home")); // "Home"

i18n.setLocale("zh-CN");
console.log(i18n.t("greeting")); // Output in Chinese when zh-CN
```

---

## 🎨 Examples

### Global Access

```typescript
import { $i18n, $t, createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({
  defaultLocale: "en-US",
  translations: {
    "en-US": { hello: "Hello" },
  },
});

i18n.install();

console.log($t("hello")); // "Hello"
console.log($i18n.getLocale()); // "en-US"

globalThis.$t("hello");
globalThis.$i18n.setLocale("en-US");
```

### TypeScript Global Types

To use global `$t` and `$i18n` in TypeScript, add type declarations.

**Option 1: Create `i18n.d.ts` in your project**

```typescript
// i18n.d.ts
import type { I18nService, TranslationParams } from "jsr:@dreamer/i18n";

declare global {
  const $t: ((key: string, params?: TranslationParams) => string) | undefined;
  const $i18n: I18nService | undefined;
}
```

**Option 2: Use exported helpers (recommended)**

```typescript
import { $i18n, $t } from "jsr:@dreamer/i18n";

$t("hello");
$i18n.setLocale("en-US");
```

### Number and Currency Formatting

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({ defaultLocale: "zh-CN" });

console.log(i18n.formatNumber(1234567.89)); // "1,234,567.89"
console.log(i18n.formatNumber(1234.5, { decimals: 0 })); // "1,235"

console.log(i18n.formatCurrency(99.99)); // "¥99.99"
console.log(i18n.formatCurrency(99.99, "€")); // "€99.99"
```

### Date Formatting

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n();
const now = new Date();

console.log(i18n.formatDate(now, "date")); // "2024-01-15"
console.log(i18n.formatDate(now, "time")); // "14:30:45"
console.log(i18n.formatDate(now, "datetime")); // "2024-01-15 14:30:45"
console.log(i18n.formatDate(now, "MMMM DD, YYYY")); // "January 15, 2024"
```

### Relative Time

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({ defaultLocale: "zh-CN" });

console.log(i18n.formatRelative(Date.now() - 1000)); // "just now"
console.log(i18n.formatRelative(Date.now() - 5 * 60 * 1000)); // "5 minutes ago"
console.log(i18n.formatRelative(Date.now() - 2 * 60 * 60 * 1000)); // "2 hours ago"

i18n.setLocale("en-US");
console.log(i18n.formatRelative(Date.now() - 5 * 60 * 1000)); // "5 minutes ago"
```

### Dynamic Translation Loading

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n();

i18n.loadTranslations("zh-CN", {
  errors: {
    required: "This field is required",
    email: "Please enter a valid email",
  },
});

console.log(i18n.t("errors.required")); // "This field is required"
```

### Locale Change Listener

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"],
});

const unsubscribe = i18n.onChange((locale) => {
  console.log(`Locale switched to: ${locale}`);
});

i18n.setLocale("en-US"); // logs: "Locale switched to: en-US"

unsubscribe();
```

### Locale Auto-Detection

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

// Option 1: Manual
const i18n = createI18n({
  locales: ["zh-CN", "en-US", "ja-JP"],
});

const detected = i18n.detectLocale();
if (detected) {
  i18n.setLocale(detected);
}

// Option 2: Auto
const i18n2 = createI18n({
  locales: ["zh-CN", "en-US", "ja-JP"],
  autoDetect: true,
});
```

### Async Translation Loading

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"],
});

await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.json");
await i18n.loadTranslationsAsync(
  "en-US",
  "https://cdn.example.com/i18n/en-US.json",
);
```

### Translation Cache

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({
  enableCache: true,
  cacheMaxSize: 500,
  translations: {
    "zh-CN": { greeting: "你好 {name}" },
  },
});

i18n.t("greeting", { name: "Alice" });
i18n.t("greeting", { name: "Alice" }); // cache hit

i18n.clearCache();
```

### Persistent Translation Bundle Cache

When using `loadTranslationsAsync`, enable persistent cache to avoid repeated
requests:

```typescript
import { createI18n } from "jsr:@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"],
  persistentCache: {
    enabled: true,
    storage: "localStorage",
    prefix: "i18n_cache_",
    maxEntries: 10,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json");
await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json"); // from cache

await i18n.loadTranslationsAsync("en-US", "/locales/en-US.def456.json");
await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json"); // from cache

i18n.clearPersistentCache();
```

**Cache behavior**:

| Feature      | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| Cache key    | Full URL as unique id, supports query params (e.g. `?t=123456`) |
| Two-tier     | Memory + persistent, prefer memory to reduce JSON parsing       |
| Invalidation | URL change (hash/timestamp) = new key = new version             |
| TTL          | Entries older than `ttl` are removed (default 7 days)           |
| LRU          | When over `maxEntries`, evict least recently used               |
| Collision    | Full URL stored to prevent hash collision                       |

**`maxEntries`**: Max number of different translation bundle URLs to cache (not
size). For 5 locales, use 5–10. LRU evicts least recently used.

---

## 📚 API

### I18n Methods

| Method                               | Description                   |
| ------------------------------------ | ----------------------------- |
| `t(key, params?)`                    | Translate                     |
| `getLocale()`                        | Get current locale            |
| `setLocale(locale)`                  | Set locale                    |
| `getLocales()`                       | Get supported locales         |
| `isLocaleSupported(locale)`          | Check if locale is supported  |
| `loadTranslations(locale, data)`     | Load translations             |
| `getTranslations(locale?)`           | Get translations              |
| `has(key)`                           | Check if key exists           |
| `formatNumber(value, options?)`      | Format number                 |
| `formatCurrency(value, currency?)`   | Format currency               |
| `formatDate(date, format?)`          | Format date                   |
| `formatRelative(date)`               | Format relative time          |
| `onChange(callback)`                 | Listen for locale changes     |
| `removeAllListeners()`               | Remove all listeners          |
| `install()`                          | Install globally              |
| `uninstall()`                        | Uninstall globally            |
| `detectLocale()`                     | Detect browser/system locale  |
| `loadTranslationsAsync(locale, url)` | Load translations from URL    |
| `clearCache()`                       | Clear translation cache       |
| `clearPersistentCache()`             | Clear persistent bundle cache |

### Config Options

| Option                            | Type                                 | Default                 | Description                    |
| --------------------------------- | ------------------------------------ | ----------------------- | ------------------------------ |
| `defaultLocale`                   | `string`                             | `"zh-CN"`               | Default locale                 |
| `locales`                         | `string[]`                           | `["zh-CN", "en-US"]`    | Supported locales              |
| `translations`                    | `Record<string, TranslationData>`    | `{}`                    | Initial translations           |
| `dateFormat.date`                 | `string`                             | `"YYYY-MM-DD"`          | Date format                    |
| `dateFormat.time`                 | `string`                             | `"HH:mm:ss"`            | Time format                    |
| `dateFormat.datetime`             | `string`                             | `"YYYY-MM-DD HH:mm:ss"` | Datetime format                |
| `numberFormat.decimals`           | `number`                             | `2`                     | Decimal places                 |
| `numberFormat.thousandsSeparator` | `string`                             | `","`                   | Thousands separator            |
| `numberFormat.decimalSeparator`   | `string`                             | `"."`                   | Decimal separator              |
| `fallbackBehavior`                | `"key" \| "empty" \| "default"`      | `"key"`                 | Fallback when key missing      |
| `escapeHtml`                      | `boolean`                            | `false`                 | Escape HTML (XSS)              |
| `enableCache`                     | `boolean`                            | `false`                 | Enable translation cache       |
| `cacheMaxSize`                    | `number`                             | `500`                   | Max cache entries              |
| `autoDetect`                      | `boolean`                            | `false`                 | Auto-detect locale             |
| `persistentCache.enabled`         | `boolean`                            | `false`                 | Enable persistent bundle cache |
| `persistentCache.storage`         | `"localStorage" \| "sessionStorage"` | `"localStorage"`        | Storage type                   |
| `persistentCache.prefix`          | `string`                             | `"i18n_cache_"`         | Cache key prefix               |
| `persistentCache.maxEntries`      | `number`                             | `10`                    | Max bundle URLs (not size)     |
| `persistentCache.ttl`             | `number`                             | `604800000`             | TTL in ms (default 7 days)     |

### Exports

```typescript
import { $i18n, $t, createI18n } from "jsr:@dreamer/i18n";

$t("greeting");
$t("welcome", { name: "Alice" });

$i18n.getLocale();
$i18n.setLocale("en-US");
$i18n.formatNumber(1234.56);
```

---

## 📊 Test Report

[![Tests](https://img.shields.io/badge/tests-71%20passed-brightgreen)](./docs/en-US/TEST_REPORT.md)

| Metric    | Value      |
| --------- | ---------- |
| Total     | 71         |
| Passed    | 71         |
| Failed    | 0          |
| Pass Rate | 100%       |
| Date      | 2026-02-01 |

See [TEST_REPORT.md](./docs/en-US/TEST_REPORT.md) for details.

---

## 📜 Changelog

**[1.1.0]** - 2026-02-17

- **Added**: `TranslationParams` now accepts `boolean` (interpolation as
  `"true"`/`"false"`).
- **Changed**: License updated to Apache 2.0. Docs reorganized into `docs/en-US`
  and `docs/zh-CN`.

Full history: [CHANGELOG](./docs/en-US/CHANGELOG.md).

---

## 📝 Notes

1. **Init required**: `$t` and `$i18n` need `install()` before use.

2. **Nested keys**: Use dot-separated keys (e.g. `nav.home`).

3. **Interpolation**: Use `{name}` placeholders.

4. **Fallback**:
   - `key`: Return key (default)
   - `empty`: Return empty string
   - `default`: Try default locale

5. **Cross-platform**: Pure JavaScript, no platform-specific deps.

6. **XSS**: Use `escapeHtml: true` to escape HTML in params.

7. **Prototype pollution**: `loadTranslations` filters dangerous keys
   (`__proto__`, `constructor`, `prototype`).

---

## 🤝 Contributing

Issues and Pull Requests welcome!

---

## 📄 License

Apache License 2.0 - see [LICENSE](./LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
