/**
 * @module @dreamer/i18n
 *
 * 国际化（i18n）库
 *
 * 提供完整的国际化功能，包括：
 * - 多语言翻译
 * - 日期、数字、货币格式化
 * - 相对时间格式化
 * - 语言检测和切换
 * - 全局 $t 函数支持
 *
 * @example
 * ```typescript
 * import { I18n, createI18n } from "@dreamer/i18n";
 *
 * // 创建实例
 * const i18n = createI18n({
 *   defaultLocale: "zh-CN",
 *   locales: ["zh-CN", "en-US"],
 *   translations: {
 *     "zh-CN": {
 *       greeting: "你好",
 *       welcome: "欢迎 {name}",
 *       nav: { home: "首页", about: "关于" }
 *     },
 *     "en-US": {
 *       greeting: "Hello",
 *       welcome: "Welcome {name}",
 *       nav: { home: "Home", about: "About" }
 *     }
 *   }
 * });
 *
 * // 使用翻译
 * console.log(i18n.t("greeting")); // "你好"
 * console.log(i18n.t("welcome", { name: "张三" })); // "欢迎 张三"
 * console.log(i18n.t("nav.home")); // "首页"
 *
 * // 切换语言
 * i18n.setLocale("en-US");
 * console.log(i18n.t("greeting")); // "Hello"
 *
 * // 格式化
 * console.log(i18n.formatNumber(1234567.89)); // "1,234,567.89"
 * console.log(i18n.formatCurrency(99.99)); // "$99.99"
 * console.log(i18n.formatDate(new Date())); // "2024-01-15"
 * console.log(i18n.formatRelative(Date.now() - 60000)); // "1 minute ago"
 *
 * // 安装到全局
 * i18n.install();
 * // 然后可以使用 globalThis.$t("greeting") 和 globalThis.$i18n
 * ```
 */

// 导出类型
export type {
  DateFormatOptions,
  GlobalI18n,
  GlobalTranslateFunction,
  I18nOptions,
  I18nService,
  LocaleChangeCallback,
  NumberFormatOptions,
  TranslationData,
  TranslationParams,
} from "./types.ts";

// 导出核心类和函数
export {
  createI18n,
  getGlobalI18n,
  getI18n,
  I18n,
  isI18nInstalled,
  setDefaultI18n,
  uninstallI18n,
} from "./i18n.ts";

// 导入用于创建便捷函数和默认导出
import { getI18n, I18n } from "./i18n.ts";
import type { GlobalI18n, I18nService, TranslationParams } from "./types.ts";

/**
 * 获取全局对象引用
 */
const getGlobalRef = (): GlobalI18n => {
  return globalThis as unknown as GlobalI18n;
};

/**
 * 全局翻译函数（便捷导出）
 *
 * 使用前需要先创建 I18n 实例或调用 install()
 *
 * @example
 * ```typescript
 * import { $t, createI18n } from "@dreamer/i18n";
 *
 * const i18n = createI18n({ translations: { ... } });
 * i18n.install();
 *
 * // 然后可以直接使用 $t
 * const greeting = $t("greeting");
 * ```
 */
export const $t = (key: string, params?: TranslationParams): string => {
  const g = getGlobalRef();
  if (g.$t) {
    return g.$t(key, params);
  }
  // 回退到默认实例
  return getI18n().t(key, params);
};

/**
 * 全局 i18n 服务代理对象（便捷导出）
 *
 * 提供对 I18n 实例方法的代理访问
 *
 * @example
 * ```typescript
 * import { $i18n, createI18n } from "@dreamer/i18n";
 *
 * const i18n = createI18n({ translations: { ... } });
 * i18n.install();
 *
 * // 使用 $i18n 代理
 * $i18n.setLocale("en-US");
 * console.log($i18n.getLocale()); // "en-US"
 * ```
 */
export const $i18n: I18nService = {
  /**
   * 翻译函数
   */
  t: (key: string, params?: TranslationParams): string => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.t(key, params);
    }
    return getI18n().t(key, params);
  },

  /**
   * 获取当前语言
   */
  getLocale: (): string => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.getLocale();
    }
    return getI18n().getLocale();
  },

  /**
   * 设置当前语言
   */
  setLocale: (locale: string): boolean => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.setLocale(locale);
    }
    return getI18n().setLocale(locale);
  },

  /**
   * 获取支持的语言列表
   */
  getLocales: (): string[] => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.getLocales();
    }
    return getI18n().getLocales();
  },

  /**
   * 检查语言是否支持
   */
  isLocaleSupported: (locale: string): boolean => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.isLocaleSupported(locale);
    }
    return getI18n().isLocaleSupported(locale);
  },

  /**
   * 加载翻译数据
   */
  loadTranslations: (locale: string, data: Record<string, unknown>): void => {
    const g = getGlobalRef();
    if (g.$i18n) {
      g.$i18n.loadTranslations(
        locale,
        data as import("./types.ts").TranslationData,
      );
      return;
    }
    getI18n().loadTranslations(
      locale,
      data as import("./types.ts").TranslationData,
    );
  },

  /**
   * 获取翻译数据
   */
  getTranslations: (locale?: string): import("./types.ts").TranslationData => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.getTranslations(locale);
    }
    return getI18n().getTranslations(locale);
  },

  /**
   * 检查翻译键是否存在
   */
  has: (key: string): boolean => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.has(key);
    }
    return getI18n().has(key);
  },

  /**
   * 格式化数字
   */
  formatNumber: (
    value: number,
    options?: Partial<import("./types.ts").NumberFormatOptions>,
  ): string => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.formatNumber(value, options);
    }
    return getI18n().formatNumber(value, options);
  },

  /**
   * 格式化货币
   */
  formatCurrency: (value: number, currency?: string): string => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.formatCurrency(value, currency);
    }
    return getI18n().formatCurrency(value, currency);
  },

  /**
   * 格式化日期
   */
  formatDate: (
    date: Date | number,
    format?: "date" | "time" | "datetime" | string,
  ): string => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.formatDate(date, format);
    }
    return getI18n().formatDate(date, format);
  },

  /**
   * 格式化相对时间
   */
  formatRelative: (date: Date | number): string => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.formatRelative(date);
    }
    return getI18n().formatRelative(date);
  },

  /**
   * 监听语言变化
   */
  onChange: (
    callback: import("./types.ts").LocaleChangeCallback,
  ): () => void => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.onChange(callback);
    }
    return getI18n().onChange(callback);
  },

  /**
   * 移除所有监听器
   */
  removeAllListeners: (): void => {
    const g = getGlobalRef();
    if (g.$i18n) {
      g.$i18n.removeAllListeners();
      return;
    }
    getI18n().removeAllListeners();
  },

  /**
   * 异步加载翻译数据
   */
  loadTranslationsAsync: async (locale: string, url: string): Promise<void> => {
    const g = getGlobalRef();
    if (g.$i18n) {
      await g.$i18n.loadTranslationsAsync(locale, url);
      return;
    }
    await getI18n().loadTranslationsAsync(locale, url);
  },

  /**
   * 检测浏览器/系统语言
   */
  detectLocale: (): string | null => {
    const g = getGlobalRef();
    if (g.$i18n) {
      return g.$i18n.detectLocale();
    }
    return getI18n().detectLocale();
  },

  /**
   * 清除翻译缓存
   */
  clearCache: (): void => {
    const g = getGlobalRef();
    if (g.$i18n) {
      g.$i18n.clearCache();
      return;
    }
    getI18n().clearCache();
  },

  /**
   * 清除持久化缓存
   */
  clearPersistentCache: (): void => {
    const g = getGlobalRef();
    if (g.$i18n) {
      g.$i18n.clearPersistentCache();
      return;
    }
    getI18n().clearPersistentCache();
  },
};

// 默认导出
export default I18n;
