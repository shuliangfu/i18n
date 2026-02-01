/**
 * @module @dreamer/i18n/i18n
 *
 * i18n 核心类
 * 提供完整的国际化功能
 */

import type {
  DateFormatOptions,
  GlobalI18n,
  I18nOptions,
  I18nService,
  LocaleChangeCallback,
  NumberFormatOptions,
  TranslationData,
  TranslationParams,
} from "./types.ts";

/**
 * 获取全局对象引用（类型安全）
 */
const getGlobalRef = (): GlobalI18n => {
  return globalThis as unknown as GlobalI18n;
};

/**
 * 预编译的插值正则表达式（性能优化）
 */
const INTERPOLATION_REGEX = /\{(\w+)\}/g;

/**
 * 时间单位常量（毫秒）（性能优化：避免重复计算）
 */
const TIME_UNITS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 危险的对象键名（安全防护：防止原型污染）
 */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * HTML 特殊字符转义映射（安全防护：防止 XSS 攻击）
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * HTML 转义正则表达式
 */
const HTML_ESCAPE_REGEX = /[&<>"']/g;

/**
 * 转义 HTML 特殊字符
 *
 * @param str - 要转义的字符串
 * @returns 转义后的字符串
 */
function escapeHtml(str: string): string {
  return str.replace(
    HTML_ESCAPE_REGEX,
    (char) => HTML_ESCAPE_MAP[char] || char,
  );
}

/**
 * I18n 国际化核心类
 *
 * 提供翻译、格式化和语言管理功能
 *
 * @example
 * ```typescript
 * import { I18n } from "@dreamer/i18n";
 *
 * const i18n = new I18n({
 *   defaultLocale: "zh-CN",
 *   locales: ["zh-CN", "en-US"],
 *   translations: {
 *     "zh-CN": { greeting: "你好", welcome: "欢迎 {name}" },
 *     "en-US": { greeting: "Hello", welcome: "Welcome {name}" }
 *   }
 * });
 *
 * console.log(i18n.t("greeting")); // "你好"
 * console.log(i18n.t("welcome", { name: "张三" })); // "欢迎 张三"
 * ```
 */
export class I18n implements I18nService {
  /** 当前语言 */
  private currentLocale: string;
  /** 默认语言 */
  private defaultLocale: string;
  /** 支持的语言列表（使用 Set 优化查找性能） */
  private localesSet: Set<string>;
  /** 支持的语言列表（数组形式，用于返回） */
  private localesArray: string[];
  /** 翻译数据存储 */
  private translations: Record<string, TranslationData>;
  /** 日期格式化选项 */
  private dateFormat: Required<DateFormatOptions>;
  /** 数字格式化选项 */
  private numberFormat: Required<NumberFormatOptions>;
  /** 缺失翻译时的回退行为 */
  private fallbackBehavior: "key" | "empty" | "default";
  /** 是否启用 HTML 转义（安全防护） */
  private escapeHtmlEnabled: boolean;
  /** 语言变化回调列表 */
  private callbacks: Set<LocaleChangeCallback> = new Set();
  /** 翻译键缓存（性能优化：缓存已解析的嵌套键路径） */
  private keyCache: Map<string, string[]> = new Map();
  /** 是否启用翻译结果缓存 */
  private cacheEnabled: boolean;
  /** 翻译结果缓存（LRU 策略） */
  private translationCache: Map<string, string> = new Map();
  /** 翻译缓存最大条数 */
  private cacheMaxSize: number;
  /** 持久化缓存配置 */
  private persistentCacheConfig: {
    enabled: boolean;
    storage: "localStorage" | "sessionStorage";
    prefix: string;
    maxEntries: number;
    ttl: number;
  };
  /** 已加载的 URL 缓存（内存层，避免重复请求） */
  private loadedUrls: Map<string, TranslationData> = new Map();

  /**
   * 创建 I18n 实例
   *
   * @param options - 配置选项
   */
  constructor(options: I18nOptions = {}) {
    this.defaultLocale = options.defaultLocale ?? "zh-CN";
    // 使用数组和 Set 双存储：Set 用于快速查找，数组用于返回
    this.localesArray = options.locales ?? ["zh-CN", "en-US"];
    this.localesSet = new Set(this.localesArray);
    this.translations = options.translations ?? {};
    this.fallbackBehavior = options.fallbackBehavior ?? "key";
    this.escapeHtmlEnabled = options.escapeHtml ?? false;
    this.cacheEnabled = options.enableCache ?? false;
    this.cacheMaxSize = options.cacheMaxSize ?? 500;

    // 持久化缓存配置
    this.persistentCacheConfig = {
      enabled: options.persistentCache?.enabled ?? false,
      storage: options.persistentCache?.storage ?? "localStorage",
      prefix: options.persistentCache?.prefix ?? "i18n_cache_",
      maxEntries: options.persistentCache?.maxEntries ?? 10,
      ttl: options.persistentCache?.ttl ?? 7 * 24 * 60 * 60 * 1000, // 默认 7 天
    };

    // 日期格式化选项
    this.dateFormat = {
      date: options.dateFormat?.date ?? "YYYY-MM-DD",
      time: options.dateFormat?.time ?? "HH:mm:ss",
      datetime: options.dateFormat?.datetime ?? "YYYY-MM-DD HH:mm:ss",
    };

    // 数字格式化选项
    this.numberFormat = {
      decimals: options.numberFormat?.decimals ?? 2,
      thousandsSeparator: options.numberFormat?.thousandsSeparator ?? ",",
      decimalSeparator: options.numberFormat?.decimalSeparator ?? ".",
    };

    // 自动检测语言
    if (options.autoDetect) {
      const detected = this.detectLocale();
      if (detected && this.localesSet.has(detected)) {
        this.currentLocale = detected;
      } else {
        this.currentLocale = this.defaultLocale;
      }
    } else {
      this.currentLocale = this.defaultLocale;
    }
  }

  /**
   * 解析并缓存键路径（性能优化）
   *
   * @param key - 键路径（如 "common.greeting"）
   * @returns 解析后的键数组
   */
  private parseKey(key: string): string[] {
    // 检查缓存
    let keys = this.keyCache.get(key);
    if (!keys) {
      keys = key.split(".");
      // 限制缓存大小，防止内存泄漏
      if (this.keyCache.size < 1000) {
        this.keyCache.set(key, keys);
      }
    }
    return keys;
  }

  /**
   * 从嵌套对象中获取翻译值
   *
   * @param data - 翻译数据
   * @param key - 键路径（支持点分隔，如 "common.greeting"）
   * @returns 翻译值或 undefined
   */
  private getNestedValue(
    data: TranslationData,
    key: string,
  ): string | undefined {
    // 使用缓存的键路径
    const keys = this.parseKey(key);
    let current: TranslationData | string = data;

    for (const k of keys) {
      if (typeof current !== "object" || current === null) {
        return undefined;
      }
      current = current[k] as TranslationData | string;
      if (current === undefined) {
        return undefined;
      }
    }

    return typeof current === "string" ? current : undefined;
  }

  /**
   * 替换翻译字符串中的参数
   *
   * @param text - 翻译文本
   * @param params - 参数对象
   * @returns 替换后的文本
   */
  private interpolate(text: string, params?: TranslationParams): string {
    if (!params) return text;

    const shouldEscape = this.escapeHtmlEnabled;

    // 使用预编译的正则表达式（性能优化）
    // 注意：需要重置 lastIndex，因为使用了全局标志
    INTERPOLATION_REGEX.lastIndex = 0;
    return text.replace(INTERPOLATION_REGEX, (_, key) => {
      const value = params[key];
      if (value === undefined) {
        return `{${key}}`;
      }
      const strValue = String(value);
      // 安全防护：如果启用了 HTML 转义，转义参数值
      return shouldEscape ? escapeHtml(strValue) : strValue;
    });
  }

  /**
   * 处理缺失的翻译
   *
   * @param key - 翻译键
   * @returns 回退值
   */
  private handleMissingTranslation(key: string): string {
    switch (this.fallbackBehavior) {
      case "empty":
        return "";
      case "default": {
        // 尝试从默认语言获取
        const defaultData = this.translations[this.defaultLocale];
        if (defaultData) {
          const value = this.getNestedValue(defaultData, key);
          if (value) return value;
        }
        return key;
      }
      case "key":
      default:
        return key;
    }
  }

  /**
   * 生成翻译缓存键
   *
   * @param key - 翻译键
   * @param params - 参数
   * @returns 缓存键
   */
  private getCacheKey(key: string, params?: TranslationParams): string {
    if (!params || Object.keys(params).length === 0) {
      return `${this.currentLocale}:${key}`;
    }
    return `${this.currentLocale}:${key}:${JSON.stringify(params)}`;
  }

  /**
   * 添加到翻译缓存（LRU 策略）
   *
   * @param cacheKey - 缓存键
   * @param value - 翻译结果
   */
  private addToCache(cacheKey: string, value: string): void {
    // 如果超出大小限制，删除最旧的条目（Map 保持插入顺序）
    if (this.translationCache.size >= this.cacheMaxSize) {
      const firstKey = this.translationCache.keys().next().value;
      if (firstKey !== undefined) {
        this.translationCache.delete(firstKey);
      }
    }
    this.translationCache.set(cacheKey, value);
  }

  /**
   * 翻译函数
   *
   * @param key - 翻译键（支持点分隔路径，如 "nav.home"）
   * @param params - 替换参数
   * @returns 翻译后的文本
   *
   * @example
   * ```typescript
   * i18n.t("greeting"); // "你好"
   * i18n.t("welcome", { name: "张三" }); // "欢迎 张三"
   * i18n.t("nav.home"); // "首页"（嵌套键）
   * ```
   */
  t(key: string, params?: TranslationParams): string {
    // 如果启用缓存，先检查缓存
    if (this.cacheEnabled) {
      const cacheKey = this.getCacheKey(key, params);
      const cached = this.translationCache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // 尝试从当前语言获取翻译
    const localeData = this.translations[this.currentLocale];
    if (localeData) {
      const value = this.getNestedValue(localeData, key);
      if (value) {
        const result = this.interpolate(value, params);
        // 缓存结果
        if (this.cacheEnabled) {
          this.addToCache(this.getCacheKey(key, params), result);
        }
        return result;
      }
    }

    // 尝试从默认语言获取翻译
    if (this.currentLocale !== this.defaultLocale) {
      const defaultData = this.translations[this.defaultLocale];
      if (defaultData) {
        const value = this.getNestedValue(defaultData, key);
        if (value) {
          const result = this.interpolate(value, params);
          // 缓存结果
          if (this.cacheEnabled) {
            this.addToCache(this.getCacheKey(key, params), result);
          }
          return result;
        }
      }
    }

    // 返回回退值
    return this.handleMissingTranslation(key);
  }

  /**
   * 获取当前语言
   *
   * @returns 当前语言代码
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * 设置语言
   *
   * @param locale - 语言代码
   * @returns 是否设置成功
   */
  setLocale(locale: string): boolean {
    // 使用 Set 快速查找（性能优化）
    if (!this.localesSet.has(locale)) {
      return false;
    }

    if (this.currentLocale === locale) {
      return true;
    }

    const oldLocale = this.currentLocale;
    this.currentLocale = locale;

    // 语言切换时清除翻译缓存（缓存键包含语言前缀，但全部清除更简单高效）
    if (this.cacheEnabled) {
      this.translationCache.clear();
    }

    // 通知回调
    this.notifyCallbacks(locale);

    // 触发全局事件（供 render 等库监听）
    this.dispatchLanguageChangedEvent(locale, oldLocale);

    return true;
  }

  /**
   * 触发语言切换全局事件
   *
   * @param locale - 新语言
   * @param oldLocale - 旧语言
   */
  private dispatchLanguageChangedEvent(
    locale: string,
    oldLocale: string,
  ): void {
    // 仅在浏览器环境中触发
    if (typeof globalThis.dispatchEvent === "function") {
      globalThis.dispatchEvent(
        new CustomEvent("i18n:language-changed", {
          detail: {
            locale,
            oldLocale,
            translations: this.translations[locale] || {},
          },
        }),
      );
    }
  }

  /**
   * 获取支持的语言列表
   *
   * @returns 语言代码数组
   */
  getLocales(): string[] {
    // 返回数组的副本，防止外部修改
    return [...this.localesArray];
  }

  /**
   * 检查语言是否支持
   *
   * @param locale - 语言代码
   * @returns 是否支持
   */
  isLocaleSupported(locale: string): boolean {
    // 使用 Set 快速查找（性能优化）
    return this.localesSet.has(locale);
  }

  /**
   * 加载翻译数据
   *
   * @param locale - 语言代码
   * @param data - 翻译数据
   */
  loadTranslations(locale: string, data: TranslationData): void {
    if (!this.translations[locale]) {
      this.translations[locale] = {};
    }
    this.mergeDeep(this.translations[locale], data);

    // 翻译数据更新时清除缓存
    if (this.cacheEnabled) {
      this.translationCache.clear();
    }
  }

  /**
   * 异步加载翻译数据
   *
   * 从 URL 加载 JSON 格式的翻译数据，支持多级缓存：
   * 1. 内存缓存（当前会话）
   * 2. 持久化缓存（localStorage/sessionStorage）
   *
   * @param locale - 语言代码
   * @param url - 翻译数据 URL（建议使用带 hash 的 URL 以支持缓存失效）
   * @throws 如果请求失败或数据格式错误
   *
   * @example
   * ```typescript
   * // 从服务器加载翻译（带 hash 的 URL 会自动缓存失效）
   * await i18n.loadTranslationsAsync("zh-CN", "/locales/zh-CN.abc123.json");
   *
   * // 从 CDN 加载
   * await i18n.loadTranslationsAsync("en-US", "https://cdn.example.com/i18n/en-US.json");
   * ```
   */
  async loadTranslationsAsync(locale: string, url: string): Promise<void> {
    // 1. 检查内存缓存
    const memoryData = this.loadedUrls.get(url);
    if (memoryData) {
      this.loadTranslations(locale, memoryData);
      return;
    }

    // 2. 检查持久化缓存
    if (this.persistentCacheConfig.enabled) {
      const cachedData = this.getFromPersistentCache(url);
      if (cachedData) {
        // 存入内存缓存
        this.loadedUrls.set(url, cachedData);
        this.loadTranslations(locale, cachedData);
        return;
      }
    }

    // 3. 从网络加载
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `[I18n] 加载翻译失败: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json() as TranslationData;

    // 4. 存入内存缓存
    this.loadedUrls.set(url, data);

    // 5. 存入持久化缓存
    if (this.persistentCacheConfig.enabled) {
      this.saveToPersistentCache(url, data);
    }

    this.loadTranslations(locale, data);
  }

  /**
   * 获取持久化存储对象
   */
  private getStorage(): Storage | null {
    if (typeof globalThis.localStorage === "undefined") {
      return null;
    }
    return this.persistentCacheConfig.storage === "sessionStorage"
      ? globalThis.sessionStorage
      : globalThis.localStorage;
  }

  /**
   * 从持久化缓存读取
   *
   * @param url - 缓存键（URL）
   * @returns 缓存的翻译数据或 null
   */
  private getFromPersistentCache(url: string): TranslationData | null {
    const storage = this.getStorage();
    if (!storage) return null;

    const key = this.persistentCacheConfig.prefix + this.hashUrl(url);
    try {
      const cached = storage.getItem(key);
      if (!cached) return null;

      const entry = JSON.parse(cached) as {
        url: string;
        timestamp: number;
        data: TranslationData;
      };

      // 检查是否过期
      if (Date.now() - entry.timestamp > this.persistentCacheConfig.ttl) {
        storage.removeItem(key);
        return null;
      }

      // 验证 URL 匹配（防止 hash 碰撞）
      if (entry.url !== url) {
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * 保存到持久化缓存
   *
   * @param url - 缓存键（URL）
   * @param data - 翻译数据
   */
  private saveToPersistentCache(url: string, data: TranslationData): void {
    const storage = this.getStorage();
    if (!storage) return;

    const key = this.persistentCacheConfig.prefix + this.hashUrl(url);
    const entry = {
      url,
      timestamp: Date.now(),
      data,
    };

    try {
      storage.setItem(key, JSON.stringify(entry));
      // 清理过期和超量的缓存
      this.cleanupPersistentCache();
    } catch {
      // 存储满了，尝试清理后重试
      this.cleanupPersistentCache();
      try {
        storage.setItem(key, JSON.stringify(entry));
      } catch {
        // 仍然失败，放弃持久化
      }
    }
  }

  /**
   * 清理持久化缓存
   * - 删除过期条目
   * - 如果超过最大数量，删除最旧的
   */
  private cleanupPersistentCache(): void {
    const storage = this.getStorage();
    if (!storage) return;

    const prefix = this.persistentCacheConfig.prefix;
    const entries: Array<{ key: string; timestamp: number }> = [];

    // 收集所有缓存条目
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      try {
        const cached = storage.getItem(key);
        if (!cached) continue;

        const entry = JSON.parse(cached) as { timestamp: number };
        const now = Date.now();

        // 删除过期条目
        if (now - entry.timestamp > this.persistentCacheConfig.ttl) {
          storage.removeItem(key);
          continue;
        }

        entries.push({ key, timestamp: entry.timestamp });
      } catch {
        // 解析失败，删除无效条目
        storage.removeItem(key);
      }
    }

    // 如果超过最大数量，删除最旧的
    if (entries.length > this.persistentCacheConfig.maxEntries) {
      // 按时间戳升序排序（旧的在前）
      entries.sort((a, b) => a.timestamp - b.timestamp);

      const toDelete = entries.length - this.persistentCacheConfig.maxEntries;
      for (let i = 0; i < toDelete; i++) {
        storage.removeItem(entries[i].key);
      }
    }
  }

  /**
   * 简单的 URL hash 函数
   * 生成短小的缓存键，避免 localStorage key 过长
   *
   * @param url - URL 字符串
   * @returns hash 字符串
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 清除持久化缓存
   * 删除所有 i18n 相关的持久化缓存
   */
  clearPersistentCache(): void {
    const storage = this.getStorage();
    if (!storage) return;

    const prefix = this.persistentCacheConfig.prefix;
    const keysToRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key);
    }

    // 同时清除内存缓存
    this.loadedUrls.clear();
  }

  /**
   * 深度合并对象（带原型污染防护）
   *
   * @param target - 目标对象
   * @param source - 源对象
   */
  private mergeDeep(target: TranslationData, source: TranslationData): void {
    for (const key of Object.keys(source)) {
      // 安全防护：跳过危险的键名，防止原型污染攻击
      if (DANGEROUS_KEYS.has(key)) {
        continue;
      }

      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        typeof sourceValue === "object" &&
        sourceValue !== null &&
        typeof targetValue === "object" &&
        targetValue !== null
      ) {
        this.mergeDeep(
          targetValue as TranslationData,
          sourceValue as TranslationData,
        );
      } else {
        target[key] = sourceValue;
      }
    }
  }

  /**
   * 获取所有翻译数据
   *
   * @param locale - 语言代码（可选，默认返回当前语言）
   * @returns 翻译数据
   */
  getTranslations(locale?: string): TranslationData {
    return this.translations[locale || this.currentLocale] || {};
  }

  /**
   * 检查翻译键是否存在
   *
   * @param key - 翻译键
   * @returns 是否存在
   */
  has(key: string): boolean {
    const localeData = this.translations[this.currentLocale];
    if (!localeData) return false;
    return this.getNestedValue(localeData, key) !== undefined;
  }

  /**
   * 格式化数字
   *
   * @param value - 数字值
   * @param options - 格式化选项（覆盖默认选项）
   * @returns 格式化后的字符串
   *
   * @example
   * ```typescript
   * i18n.formatNumber(1234567.89); // "1,234,567.89"
   * i18n.formatNumber(1234.5, { decimals: 0 }); // "1,235"
   * ```
   */
  formatNumber(value: number, options?: Partial<NumberFormatOptions>): string {
    const opts = { ...this.numberFormat, ...options };

    // 固定小数位数
    const fixed = value.toFixed(opts.decimals);

    // 分离整数和小数部分
    const [intPart, decPart] = fixed.split(".");

    // 添加千位分隔符
    const formattedInt = intPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      opts.thousandsSeparator,
    );

    // 组合结果
    if (decPart) {
      return `${formattedInt}${opts.decimalSeparator}${decPart}`;
    }

    return formattedInt;
  }

  /**
   * 格式化货币
   *
   * @param value - 金额
   * @param currency - 货币符号（默认根据语言选择）
   * @returns 格式化后的货币字符串
   *
   * @example
   * ```typescript
   * i18n.formatCurrency(1234.56); // "¥1,234.56" (zh-CN) 或 "$1,234.56" (en-US)
   * i18n.formatCurrency(1234.56, "€"); // "€1,234.56"
   * ```
   */
  formatCurrency(value: number, currency?: string): string {
    const currencySymbol = currency ??
      (this.currentLocale.startsWith("zh")
        ? "¥"
        : this.currentLocale.startsWith("en")
        ? "$"
        : "¤");

    return `${currencySymbol}${this.formatNumber(value)}`;
  }

  /**
   * 格式化日期
   *
   * @param date - 日期对象或时间戳
   * @param format - 格式类型（"date" | "time" | "datetime"）或自定义格式
   * @returns 格式化后的日期字符串
   *
   * @example
   * ```typescript
   * i18n.formatDate(new Date(), "date"); // "2024-01-15"
   * i18n.formatDate(Date.now(), "datetime"); // "2024-01-15 14:30:00"
   * ```
   */
  formatDate(
    date: Date | number,
    format: "date" | "time" | "datetime" | string = "date",
  ): string {
    const d = typeof date === "number" ? new Date(date) : date;

    // 获取格式模板
    let pattern: string;
    if (format === "date" || format === "time" || format === "datetime") {
      pattern = this.dateFormat[format];
    } else {
      pattern = format;
    }

    // 格式化各个部分
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    // 替换占位符
    return pattern
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }

  /**
   * 格式化相对时间
   *
   * @param date - 日期对象或时间戳
   * @returns 相对时间字符串
   *
   * @example
   * ```typescript
   * i18n.formatRelative(Date.now() - 60000); // "1 分钟前" (zh-CN) 或 "1 minute ago" (en-US)
   * ```
   */
  formatRelative(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date;
    const now = Date.now();
    const diff = now - d.getTime();
    const absDiff = Math.abs(diff);

    const isZh = this.currentLocale.startsWith("zh");

    // 使用预定义的时间常量（性能优化）
    const { MINUTE, HOUR, DAY, WEEK, MONTH, YEAR } = TIME_UNITS;

    // 根据时间差选择合适的单位
    let value: number;
    let unit: string;

    if (absDiff < MINUTE) {
      return isZh ? "刚刚" : "just now";
    } else if (absDiff < HOUR) {
      value = Math.floor(absDiff / MINUTE);
      unit = isZh ? "分钟" : value === 1 ? "minute" : "minutes";
    } else if (absDiff < DAY) {
      value = Math.floor(absDiff / HOUR);
      unit = isZh ? "小时" : value === 1 ? "hour" : "hours";
    } else if (absDiff < WEEK) {
      value = Math.floor(absDiff / DAY);
      unit = isZh ? "天" : value === 1 ? "day" : "days";
    } else if (absDiff < MONTH) {
      value = Math.floor(absDiff / WEEK);
      unit = isZh ? "周" : value === 1 ? "week" : "weeks";
    } else if (absDiff < YEAR) {
      value = Math.floor(absDiff / MONTH);
      unit = isZh ? "个月" : value === 1 ? "month" : "months";
    } else {
      value = Math.floor(absDiff / YEAR);
      unit = isZh ? "年" : value === 1 ? "year" : "years";
    }

    // 格式化结果
    if (isZh) {
      return diff > 0 ? `${value} ${unit}前` : `${value} ${unit}后`;
    } else {
      return diff > 0 ? `${value} ${unit} ago` : `in ${value} ${unit}`;
    }
  }

  /**
   * 监听语言变化
   *
   * @param callback - 语言变化时的回调函数
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * const unsubscribe = i18n.onChange((locale) => {
   *   console.log(`语言已切换到: ${locale}`);
   * });
   *
   * // 稍后取消监听
   * unsubscribe();
   * ```
   */
  onChange(callback: LocaleChangeCallback): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(): void {
    this.callbacks.clear();
  }

  /**
   * 检测浏览器/系统语言
   *
   * 按优先级检测：
   * 1. 浏览器 navigator.language
   * 2. 浏览器 navigator.languages
   * 3. 服务端环境变量 LANG / LC_ALL
   *
   * @returns 检测到的语言代码，未检测到返回 null
   *
   * @example
   * ```typescript
   * const detected = i18n.detectLocale();
   * if (detected && i18n.isLocaleSupported(detected)) {
   *   i18n.setLocale(detected);
   * }
   * ```
   */
  detectLocale(): string | null {
    // 浏览器环境
    if (typeof globalThis.navigator !== "undefined") {
      const nav = globalThis.navigator as Navigator & { languages?: string[] };

      // 尝试精确匹配
      if (nav.language && this.localesSet.has(nav.language)) {
        return nav.language;
      }

      // 尝试从 languages 列表匹配
      if (nav.languages) {
        for (const lang of nav.languages) {
          if (this.localesSet.has(lang)) {
            return lang;
          }
          // 尝试匹配主语言代码（如 "zh" 匹配 "zh-CN"）
          const primary = lang.split("-")[0];
          for (const locale of this.localesArray) {
            if (locale.startsWith(primary + "-") || locale === primary) {
              return locale;
            }
          }
        }
      }

      // 尝试匹配主语言代码
      if (nav.language) {
        const primary = nav.language.split("-")[0];
        for (const locale of this.localesArray) {
          if (locale.startsWith(primary + "-") || locale === primary) {
            return locale;
          }
        }
      }
    }

    // 服务端环境（Deno/Node）
    if (typeof globalThis.Deno !== "undefined") {
      const env = globalThis.Deno.env;
      const langEnv = env.get?.("LC_ALL") || env.get?.("LANG") ||
        env.get?.("LANGUAGE");
      if (langEnv) {
        // 解析环境变量（如 "zh_CN.UTF-8" -> "zh-CN"）
        const match = langEnv.match(/^([a-z]{2})[-_]([A-Z]{2})/i);
        if (match) {
          const normalized = `${match[1].toLowerCase()}-${
            match[2].toUpperCase()
          }`;
          if (this.localesSet.has(normalized)) {
            return normalized;
          }
        }
        // 尝试匹配主语言代码
        const primary = langEnv.substring(0, 2).toLowerCase();
        for (const locale of this.localesArray) {
          if (locale.startsWith(primary + "-") || locale === primary) {
            return locale;
          }
        }
      }
    }

    return null;
  }

  /**
   * 清除翻译缓存
   *
   * 手动清除所有缓存的翻译结果
   *
   * @example
   * ```typescript
   * i18n.clearCache();
   * ```
   */
  clearCache(): void {
    this.translationCache.clear();
  }

  /**
   * 通知所有回调
   *
   * @param locale - 当前语言
   */
  private notifyCallbacks(locale: string): void {
    for (const callback of this.callbacks) {
      try {
        callback(locale);
      } catch (error) {
        console.error("[I18n] 回调执行出错:", error);
      }
    }
  }

  /**
   * 安装到全局对象
   *
   * 将 $t 函数和 $i18n 实例挂载到 globalThis
   *
   * @example
   * ```typescript
   * const i18n = new I18n({ ... });
   * i18n.install();
   *
   * // 然后可以全局使用
   * globalThis.$t("greeting");
   * globalThis.$i18n.setLocale("en-US");
   * ```
   */
  install(): void {
    const g = getGlobalRef();
    g.$t = (key: string, params?: TranslationParams) => this.t(key, params);
    g.$i18n = this;
  }

  /**
   * 从全局对象卸载
   */
  uninstall(): void {
    const g = getGlobalRef();
    g.$t = undefined;
    g.$i18n = undefined;
  }
}

/**
 * 创建 I18n 实例的工厂函数
 *
 * @param options - 配置选项
 * @returns I18n 实例
 *
 * @example
 * ```typescript
 * import { createI18n } from "@dreamer/i18n";
 *
 * const i18n = createI18n({
 *   defaultLocale: "zh-CN",
 *   translations: { ... }
 * });
 * ```
 */
export function createI18n(options: I18nOptions = {}): I18n {
  return new I18n(options);
}

// 默认实例（懒加载）
let defaultInstance: I18n | null = null;

/**
 * 获取默认的 I18n 实例
 *
 * @returns 默认的 I18n 实例
 */
export function getI18n(): I18n {
  if (!defaultInstance) {
    defaultInstance = new I18n();
  }
  return defaultInstance;
}

/**
 * 设置默认的 I18n 实例
 *
 * @param i18n - I18n 实例
 */
export function setDefaultI18n(i18n: I18n): void {
  defaultInstance = i18n;
}

/**
 * 获取全局 I18n 实例
 *
 * @returns I18n 实例或 undefined
 */
export function getGlobalI18n(): I18nService | undefined {
  return getGlobalRef().$i18n;
}

/**
 * 检查 I18n 是否已安装到全局
 *
 * @returns 是否已安装
 */
export function isI18nInstalled(): boolean {
  return typeof getGlobalRef().$t === "function";
}

/**
 * 卸载全局 I18n
 */
export function uninstallI18n(): void {
  const g = getGlobalRef();
  g.$t = undefined;
  g.$i18n = undefined;
}
