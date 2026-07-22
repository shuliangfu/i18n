# @dreamer/i18n

> 轻量级国际化（i18n）包，支持翻译、格式化和多语言管理

[English](../../README.md) | 中文 (Chinese)

[![JSR](https://jsr.io/badges/@dreamer/i18n)](https://jsr.io/@dreamer/i18n)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-71%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 功能

轻量级国际化包，提供完整的多语言支持。无外部依赖，纯 JavaScript
实现，浏览器和服务端通用。

---

## 📦 安装

### Deno

```bash
deno add jsr:@dreamer/i18n
```

### Bun

```bash
bunx jsr add @dreamer/i18n
```

---

## 🌍 环境兼容性

| 环境        | 版本要求 | 状态        |
| ----------- | -------- | ----------- |
| **Deno**    | 2.0+     | ✅ 完全支持 |
| **Bun**     | 1.0+     | ✅ 完全支持 |
| **浏览器**  | ES2020+  | ✅ 完全支持 |
| **Node.js** | 18+      | ✅ 完全支持 |

---

## ✨ 特性

### 翻译功能

- **多语言翻译**：支持任意数量的语言
- **嵌套键**：支持点分隔的嵌套键（如 `nav.home`）
- **参数插值**：支持 `{name}` 格式的占位符替换
- **语言回退**：当前语言缺失时自动回退到默认语言

### 格式化功能

- **数字格式化**：千位分隔符、小数位数自定义
- **货币格式化**：根据语言自动选择货币符号
- **日期格式化**：支持日期、时间、日期时间格式
- **相对时间**：自动计算"刚刚"、"5 分钟前"等

### 语言管理

- **语言切换**：动态切换当前语言
- **语言检测**：检查语言是否支持
- **自动检测**：从浏览器/系统检测语言偏好
- **事件监听**：监听语言变化事件
- **异步加载**：从 URL 异步加载翻译数据

### 性能优化

- **翻译缓存**：缓存翻译结果，避免重复解析
- **LRU 策略**：限制缓存大小，自动淘汰旧条目
- **键路径缓存**：缓存嵌套键解析结果

### 全局访问

- **全局 $t**：安装后可全局使用 `$t()` 翻译函数
- **全局 $i18n**：安装后可全局访问 i18n 服务
- **便捷导出**：可直接导入 `$t` 和 `$i18n` 使用

---

## 🎯 使用场景

- **多语言网站**：构建支持多种语言的网站
- **国际化应用**：Web 应用、移动应用的国际化
- **日期时间显示**：根据用户语言显示本地化日期时间
- **数字货币格式**：根据地区格式化数字和货币
- **动态语言切换**：实时切换应用语言

---

## 🚀 快速开始

```typescript
import { createI18n } from "@dreamer/i18n";

// 创建 i18n 实例
const i18n = createI18n({
  defaultLocale: "zh-CN",
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

// 翻译
console.log(i18n.t("greeting")); // "你好"
console.log(i18n.t("welcome", { name: "张三" })); // "欢迎 张三"
console.log(i18n.t("nav.home")); // "首页"

// 切换语言
i18n.setLocale("en-US");
console.log(i18n.t("greeting")); // "Hello"
```

---

## 🎨 使用示例

### 全局访问

```typescript
import { $i18n, $t, createI18n } from "@dreamer/i18n";

const i18n = createI18n({
  translations: {
    "zh-CN": { hello: "你好" },
  },
});

// 安装到全局
i18n.install();

// 使用便捷方法
console.log($t("hello")); // "你好"
console.log($i18n.getLocale()); // "zh-CN"

// 或使用 globalThis
globalThis.$t("hello");
globalThis.$i18n.setLocale("en-US");
```

### TypeScript 全局类型支持

如需在 TypeScript 中直接使用全局 `$t` 和 `$i18n`，需要添加类型声明。

**方法 1：在项目中创建 `i18n.d.ts`**

```typescript
// i18n.d.ts
import type { I18nService, TranslationParams } from "@dreamer/i18n";

declare global {
  const $t: ((key: string, params?: TranslationParams) => string) | undefined;
  const $i18n: I18nService | undefined;
}
```

**方法 2：使用导出的便捷方法（推荐）**

```typescript
import { $i18n, $t } from "@dreamer/i18n";

// 直接使用导入的方法，无需全局类型声明
$t("hello");
$i18n.setLocale("en-US");
```

### 数字和货币格式化

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({ defaultLocale: "zh-CN" });

// 数字格式化
console.log(i18n.formatNumber(1234567.89)); // "1,234,567.89"
console.log(i18n.formatNumber(1234.5, { decimals: 0 })); // "1,235"

// 货币格式化
console.log(i18n.formatCurrency(99.99)); // "¥99.99"
console.log(i18n.formatCurrency(99.99, "€")); // "€99.99"
```

### 日期格式化

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n();
const now = new Date();

console.log(i18n.formatDate(now, "date")); // "2024-01-15"
console.log(i18n.formatDate(now, "time")); // "14:30:45"
console.log(i18n.formatDate(now, "datetime")); // "2024-01-15 14:30:45"
console.log(i18n.formatDate(now, "YYYY年MM月DD日")); // "2024年01月15日"
```

### 相对时间

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({ defaultLocale: "zh-CN" });

console.log(i18n.formatRelative(Date.now() - 1000)); // "刚刚"
console.log(i18n.formatRelative(Date.now() - 5 * 60 * 1000)); // "5 分钟前"
console.log(i18n.formatRelative(Date.now() - 2 * 60 * 60 * 1000)); // "2 小时前"

// 英文
i18n.setLocale("en-US");
console.log(i18n.formatRelative(Date.now() - 5 * 60 * 1000)); // "5 minutes ago"
```

### 动态加载翻译

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n();

// 动态加载翻译数据
i18n.loadTranslations("zh-CN", {
  errors: {
    required: "此字段为必填项",
    email: "请输入有效的邮箱地址",
  },
});

console.log(i18n.t("errors.required")); // "此字段为必填项"
```

### 语言变化监听

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"],
});

// 监听语言变化
const unsubscribe = i18n.onChange((locale) => {
  console.log(`语言已切换到: ${locale}`);
});

i18n.setLocale("en-US"); // 输出: "语言已切换到: en-US"

// 取消监听
unsubscribe();
```

### 语言自动检测

```typescript
import { createI18n } from "@dreamer/i18n";

// 方式 1：手动检测
const i18n = createI18n({
  locales: ["zh-CN", "en-US", "ja-JP"],
});

const detected = i18n.detectLocale();
if (detected) {
  i18n.setLocale(detected);
}

// 方式 2：自动检测
const i18n2 = createI18n({
  locales: ["zh-CN", "en-US", "ja-JP"],
  autoDetect: true, // 创建时自动检测并设置语言
});
```

### 异步加载翻译

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"],
});

// 从 URL 加载翻译
await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.json");
await i18n.loadTranslationsAsync(
  "en-US",
  "https://cdn.example.com/i18n/en-US.json",
);
```

### 翻译缓存

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({
  enableCache: true, // 启用翻译结果缓存
  cacheMaxSize: 500, // 最多缓存 500 条（默认）
  translations: {
    "zh-CN": { greeting: "你好 {name}" },
  },
});

// 第一次翻译，结果会被缓存
i18n.t("greeting", { name: "张三" });

// 后续相同参数的翻译直接从缓存返回
i18n.t("greeting", { name: "张三" }); // 命中缓存

// 手动清除缓存
i18n.clearCache();
```

### 语言包持久化缓存

当使用 `loadTranslationsAsync` 加载语言包时，可以启用持久化缓存，避免重复请求：

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"],
  persistentCache: {
    enabled: true, // 启用持久化缓存
    storage: "localStorage", // 存储类型（默认 localStorage）
    prefix: "i18n_cache_", // 缓存键前缀
    maxEntries: 10, // 最多缓存 10 个语言包（LRU 淘汰）
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 天过期
  },
});

// 第一次加载：从网络请求，并缓存到 localStorage
await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json");

// 第二次加载相同 URL：直接从缓存读取，无网络请求
await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json");

// 切换语言，加载新语言包
await i18n.loadTranslationsAsync("en-US", "/locales/en-US.def456.json");

// 再次切换回中文：直接从缓存读取
await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json");

// 清除所有持久化缓存
i18n.clearPersistentCache();
```

**缓存策略说明**：

| 特性     | 说明                                                   |
| -------- | ------------------------------------------------------ |
| 缓存键   | 完整 URL 作为唯一标识，支持查询参数（如 `?t=123456`）  |
| 双层缓存 | 内存 + 持久化，优先读内存，减少 JSON 解析开销          |
| 自动失效 | URL 变化（hash/时间戳变化）= 新缓存键 = 自动使用新版本 |
| TTL 过期 | 超过 `ttl` 时间的条目自动删除（默认 7 天）             |
| LRU 淘汰 | 超过 `maxEntries` 数量时，删除最久未访问的条目         |
| 碰撞检测 | 缓存中存储完整 URL，防止 hash 碰撞                     |

**`maxEntries` 说明**：

- 指最多缓存多少个**不同 URL** 的语言包文件（不是大小限制）
- 例如：应用支持 5 种语言，建议设置为 `5-10`
- LRU（Least Recently Used）策略：超量时删除最久未访问的

---

## 📚 API 文档

### I18n 类

| 方法                                 | 说明                 |
| ------------------------------------ | -------------------- |
| `t(key, params?)`                    | 翻译函数             |
| `getLocale()`                        | 获取当前语言         |
| `setLocale(locale)`                  | 设置语言             |
| `getLocales()`                       | 获取支持的语言列表   |
| `isLocaleSupported(locale)`          | 检查语言是否支持     |
| `loadTranslations(locale, data)`     | 加载翻译数据         |
| `getTranslations(locale?)`           | 获取翻译数据         |
| `has(key)`                           | 检查翻译键是否存在   |
| `formatNumber(value, options?)`      | 格式化数字           |
| `formatCurrency(value, currency?)`   | 格式化货币           |
| `formatDate(date, format?)`          | 格式化日期           |
| `formatRelative(date)`               | 格式化相对时间       |
| `onChange(callback)`                 | 监听语言变化         |
| `removeAllListeners()`               | 移除所有监听器       |
| `install()`                          | 安装到全局           |
| `uninstall()`                        | 从全局卸载           |
| `detectLocale()`                     | 检测浏览器/系统语言  |
| `loadTranslationsAsync(locale, url)` | 异步加载翻译数据     |
| `clearCache()`                       | 清除翻译结果缓存     |
| `clearPersistentCache()`             | 清除持久化语言包缓存 |

### 配置选项

| 选项                              | 类型                                 | 默认值                  | 说明                                     |
| --------------------------------- | ------------------------------------ | ----------------------- | ---------------------------------------- |
| `defaultLocale`                   | `string`                             | `"zh-CN"`               | 默认语言                                 |
| `locales`                         | `string[]`                           | `["zh-CN", "en-US"]`    | 支持的语言列表                           |
| `translations`                    | `Record<string, TranslationData>`    | `{}`                    | 初始翻译数据                             |
| `dateFormat.date`                 | `string`                             | `"YYYY-MM-DD"`          | 日期格式                                 |
| `dateFormat.time`                 | `string`                             | `"HH:mm:ss"`            | 时间格式                                 |
| `dateFormat.datetime`             | `string`                             | `"YYYY-MM-DD HH:mm:ss"` | 日期时间格式                             |
| `numberFormat.decimals`           | `number`                             | `2`                     | 小数位数                                 |
| `numberFormat.thousandsSeparator` | `string`                             | `","`                   | 千位分隔符                               |
| `numberFormat.decimalSeparator`   | `string`                             | `"."`                   | 小数分隔符                               |
| `fallbackBehavior`                | `"key" \| "empty" \| "default"`      | `"key"`                 | 缺失翻译回退行为                         |
| `escapeHtml`                      | `boolean`                            | `false`                 | 是否转义 HTML 特殊字符（防止 XSS）       |
| `enableCache`                     | `boolean`                            | `false`                 | 是否启用翻译结果缓存                     |
| `cacheMaxSize`                    | `number`                             | `500`                   | 翻译缓存最大条数                         |
| `autoDetect`                      | `boolean`                            | `false`                 | 是否自动检测语言                         |
| `persistentCache.enabled`         | `boolean`                            | `false`                 | 是否启用语言包持久化缓存                 |
| `persistentCache.storage`         | `"localStorage" \| "sessionStorage"` | `"localStorage"`        | 持久化存储类型                           |
| `persistentCache.prefix`          | `string`                             | `"i18n_cache_"`         | 缓存键前缀                               |
| `persistentCache.maxEntries`      | `number`                             | `10`                    | 最大缓存条目数（语言包文件数量，非大小） |
| `persistentCache.ttl`             | `number`                             | `604800000`             | 缓存过期时间（毫秒，默认 7 天）          |

### 便捷导出

```typescript
import { $i18n, $t, createI18n } from "@dreamer/i18n";

// $t - 全局翻译函数
$t("greeting");
$t("welcome", { name: "张三" });

// $i18n - 全局 i18n 服务
$i18n.getLocale();
$i18n.setLocale("en-US");
$i18n.formatNumber(1234.56);
```

---

## 📊 测试报告

[![Tests](https://img.shields.io/badge/tests-71%20passed-brightgreen)](./TEST_REPORT.md)

| 指标     | 值         |
| -------- | ---------- |
| 总测试数 | 71         |
| 通过     | 71         |
| 失败     | 0          |
| 通过率   | 100%       |
| 测试时间 | 2026-02-01 |

详细测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)

---

## 📜 变更日志

**[1.1.0]** - 2026-07-22

- **新增**：Node.js（>=22）兼容——新增 `package.json`、`tsconfig.json`、
  `.npmrc`（`@jsr` registry）及三端 CI 工作流（Deno/Bun/Node ×
  Linux/macOS/Windows）。
- **变更**：`detectLocale()` 在 Node/Bun 上读取 `process.env`（Deno 路径保留）；
  `@dreamer/test` 升至 `^1.2.0`。
- **性能**：`t()` 缓存键由两次计算改为一次；`formatNumber()` 千位分隔正则预编译
  为模块常量；移除死代码 `lastIndex` 重置。
- **安全**：`loadTranslationsAsync()` 校验响应为非空对象；`getStorage()` 改为
  校验实际配置的存储。
- **重构**：`$i18n` 转发样板替换为单个 `Proxy`。

**[1.0.1]** - 2026-02-17

- **新增**：`TranslationParams` 现支持 `boolean`（插值为 `"true"`/`"false"`）。
- **变更**：许可证更新为 Apache 2.0。文档按语言拆分至 `docs/en-US` 与
  `docs/zh-CN`。

完整历史：[CHANGELOG](./CHANGELOG.md)。

---

## 📝 注意事项

1. **使用前需初始化**：`$t` 和 `$i18n` 在使用前需要先创建实例并调用
   `install()`。

2. **嵌套键**：支持使用点分隔的嵌套键，如 `nav.home`。

3. **参数插值**：使用 `{name}` 格式的占位符进行参数替换。

4. **回退行为**：
   - `key`：返回键名（默认）
   - `empty`：返回空字符串
   - `default`：尝试从默认语言获取

5. **跨平台兼容**：包使用纯 JavaScript 实现，无平台特定依赖，可在任何 JavaScript
   环境运行。

6. **XSS 防护**：启用 `escapeHtml: true` 可自动转义参数中的 HTML 特殊字符，防止
   XSS 攻击。

7. **原型污染防护**：`loadTranslations`
   会自动过滤危险的键名（`__proto__`、`constructor`、`prototype`）。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](../../LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
