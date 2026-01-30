# @dreamer/i18n

> 轻量级国际化（i18n）库，支持翻译、格式化和多语言管理

[![JSR](https://jsr.io/badges/@dreamer/i18n)](https://jsr.io/@dreamer/i18n)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md)
[![Tests](https://img.shields.io/badge/tests-58%20passed-brightgreen)](./TEST_REPORT.md)

---

## 🎯 功能

轻量级国际化库，提供完整的多语言支持。无外部依赖，纯 JavaScript 实现，浏览器和服务端通用。

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

| 环境 | 版本要求 | 状态 |
|------|---------|------|
| **Deno** | 2.0+ | ✅ 完全支持 |
| **Bun** | 1.0+ | ✅ 完全支持 |
| **浏览器** | ES2020+ | ✅ 完全支持 |
| **Node.js** | 18+ | ✅ 完全支持 |

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
- **事件监听**：监听语言变化事件

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
      nav: { home: "首页", about: "关于" }
    },
    "en-US": {
      greeting: "Hello",
      welcome: "Welcome {name}",
      nav: { home: "Home", about: "About" }
    }
  }
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
import { createI18n, $t, $i18n } from "@dreamer/i18n";

const i18n = createI18n({
  translations: {
    "zh-CN": { hello: "你好" }
  }
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
import { $t, $i18n } from "@dreamer/i18n";

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
    email: "请输入有效的邮箱地址"
  }
});

console.log(i18n.t("errors.required")); // "此字段为必填项"
```

### 语言变化监听

```typescript
import { createI18n } from "@dreamer/i18n";

const i18n = createI18n({
  locales: ["zh-CN", "en-US"]
});

// 监听语言变化
const unsubscribe = i18n.onChange((locale) => {
  console.log(`语言已切换到: ${locale}`);
});

i18n.setLocale("en-US"); // 输出: "语言已切换到: en-US"

// 取消监听
unsubscribe();
```

---

## 📚 API 文档

### I18n 类

| 方法 | 说明 |
|------|------|
| `t(key, params?)` | 翻译函数 |
| `getLocale()` | 获取当前语言 |
| `setLocale(locale)` | 设置语言 |
| `getLocales()` | 获取支持的语言列表 |
| `isLocaleSupported(locale)` | 检查语言是否支持 |
| `loadTranslations(locale, data)` | 加载翻译数据 |
| `getTranslations(locale?)` | 获取翻译数据 |
| `has(key)` | 检查翻译键是否存在 |
| `formatNumber(value, options?)` | 格式化数字 |
| `formatCurrency(value, currency?)` | 格式化货币 |
| `formatDate(date, format?)` | 格式化日期 |
| `formatRelative(date)` | 格式化相对时间 |
| `onChange(callback)` | 监听语言变化 |
| `removeAllListeners()` | 移除所有监听器 |
| `install()` | 安装到全局 |
| `uninstall()` | 从全局卸载 |

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultLocale` | `string` | `"zh-CN"` | 默认语言 |
| `locales` | `string[]` | `["zh-CN", "en-US"]` | 支持的语言列表 |
| `translations` | `Record<string, TranslationData>` | `{}` | 初始翻译数据 |
| `dateFormat.date` | `string` | `"YYYY-MM-DD"` | 日期格式 |
| `dateFormat.time` | `string` | `"HH:mm:ss"` | 时间格式 |
| `dateFormat.datetime` | `string` | `"YYYY-MM-DD HH:mm:ss"` | 日期时间格式 |
| `numberFormat.decimals` | `number` | `2` | 小数位数 |
| `numberFormat.thousandsSeparator` | `string` | `","` | 千位分隔符 |
| `numberFormat.decimalSeparator` | `string` | `"."` | 小数分隔符 |
| `fallbackBehavior` | `"key" \| "empty" \| "default"` | `"key"` | 缺失翻译回退行为 |
| `escapeHtml` | `boolean` | `false` | 是否转义 HTML 特殊字符（防止 XSS） |

### 便捷导出

```typescript
import { $t, $i18n, createI18n } from "@dreamer/i18n";

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

[![Tests](https://img.shields.io/badge/tests-58%20passed-brightgreen)](./TEST_REPORT.md)

| 指标 | 值 |
|------|-----|
| 总测试数 | 58 |
| 通过 | 58 |
| 失败 | 0 |
| 通过率 | 100% |
| 测试时间 | 2026-01-30 |

详细测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)

---

## 📝 注意事项

1. **使用前需初始化**：`$t` 和 `$i18n` 在使用前需要先创建实例并调用 `install()`。

2. **嵌套键**：支持使用点分隔的嵌套键，如 `nav.home`。

3. **参数插值**：使用 `{name}` 格式的占位符进行参数替换。

4. **回退行为**：
   - `key`：返回键名（默认）
   - `empty`：返回空字符串
   - `default`：尝试从默认语言获取

5. **跨平台兼容**：库使用纯 JavaScript 实现，无平台特定依赖，可在任何 JavaScript 环境运行。

6. **XSS 防护**：启用 `escapeHtml: true` 可自动转义参数中的 HTML 特殊字符，防止 XSS 攻击。

7. **原型污染防护**：`loadTranslations` 会自动过滤危险的键名（`__proto__`、`constructor`、`prototype`）。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE.md](./LICENSE.md)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
