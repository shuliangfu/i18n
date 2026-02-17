# 变更日志

本项目的所有重要变更将记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-02-17

### 新增

- **TranslationParams**：类型现支持 `boolean`；插值时将转为 `"true"` / `"false"`
  参与占位替换。

### 变更

- **许可证**：更新为 Apache 2.0。

### 文档

- 文档按语言拆分至 `docs/en-US` 与
  `docs/zh-CN`（README、CHANGELOG、TEST_REPORT）。根目录仅保留英文 README。

---

## [1.0.0] - 2026-02-06

### 新增

首个稳定版。轻量级国际化（i18n）库，兼容 Deno、Bun、Node.js 与浏览器。纯
JavaScript，无外部依赖。

#### 翻译

- **多语言**：支持任意数量语言
- **嵌套键**：点分隔键（如 `nav.home`）
- **插值**：`{name}` 占位符替换
- **回退**：当前语言缺失时回退到默认语言
- **回退行为**：可通过 `fallbackBehavior` 配置（`key`、`empty`、`default`）

#### 格式化

- **数字格式化**：`formatNumber()`，千位分隔、小数位
- **货币格式化**：`formatCurrency()`，按语言自动符号或自定义
- **日期格式化**：`formatDate()`，日期、时间、日期时间及自定义格式
- **相对时间**：`formatRelative()`，如「刚刚」「5 分钟前」等

#### 语言管理

- **语言切换**：`setLocale()`、`getLocale()`、`getLocales()`
- **支持检查**：`isLocaleSupported()`
- **自动检测**：`detectLocale()` 从浏览器/系统偏好检测，支持 `autoDetect` 选项
- **动态加载**：`loadTranslations()` 合并翻译数据
- **异步加载**：`loadTranslationsAsync()` 从 URL 加载

#### 事件

- **语言变更监听**：`onChange()`，支持取消订阅
- **移除监听**：`removeAllListeners()`

#### 全局访问

- **安装/卸载**：`install()`、`uninstall()` 注册/移除全局
- **便捷导出**：直接导入 `$t`、`$i18n`
- **全局方法**：安装后可在 `globalThis` 上使用 `$t()`、`$i18n`

#### 性能

- **翻译缓存**：`enableCache`、`cacheMaxSize`、`clearCache()`
- **LRU 缓存**：限制大小、淘汰最少使用
- **键路径缓存**：缓存嵌套键解析

#### 持久化缓存

- **文案包缓存**：`persistentCache` 配置，缓存已加载的翻译包
- **存储**：`localStorage` 或 `sessionStorage`
- **TTL**：可配置过期（默认 7 天）
- **LRU 淘汰**：`maxEntries` 控制文案包 URL 数量
- **双层缓存**：内存 + 持久化，`clearPersistentCache()`

#### 安全

- **XSS 防护**：`escapeHtml` 选项转义参数中的 HTML
- **原型污染防护**：`loadTranslations`
  过滤危险键（`__proto__`、`constructor`、`prototype`）

#### 工厂与单例

- **createI18n()**：创建 I18n 实例
- **getI18n()**：获取单例
- **setDefaultI18n()**：设置默认实例

#### 类型导出

- `I18nService`、`TranslationParams`、`TranslationData`
- `createI18n`、`getI18n`、`setDefaultI18n`、`$t`、`$i18n`
