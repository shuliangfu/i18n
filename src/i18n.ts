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
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
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
    this.currentLocale = this.defaultLocale;

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
  private getNestedValue(data: TranslationData, key: string): string | undefined {
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
    // 尝试从当前语言获取翻译
    const localeData = this.translations[this.currentLocale];
    if (localeData) {
      const value = this.getNestedValue(localeData, key);
      if (value) {
        return this.interpolate(value, params);
      }
    }

    // 尝试从默认语言获取翻译
    if (this.currentLocale !== this.defaultLocale) {
      const defaultData = this.translations[this.defaultLocale];
      if (defaultData) {
        const value = this.getNestedValue(defaultData, key);
        if (value) {
          return this.interpolate(value, params);
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
  private dispatchLanguageChangedEvent(locale: string, oldLocale: string): void {
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
        this.mergeDeep(targetValue as TranslationData, sourceValue as TranslationData);
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
