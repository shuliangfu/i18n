/**
 * @module @dreamer/i18n/types
 *
 * i18n 库类型定义
 */

/**
 * 翻译参数类型
 * 用于翻译字符串中的占位符替换
 *
 * @example
 * ```typescript
 * const params: TranslationParams = { name: "张三", count: 5 };
 * ```
 */
export type TranslationParams = Record<string, string | number>;

/**
 * 翻译数据结构
 * 支持嵌套对象结构
 *
 * @example
 * ```typescript
 * const data: TranslationData = {
 *   greeting: "你好",
 *   nav: {
 *     home: "首页",
 *     about: "关于"
 *   }
 * };
 * ```
 */
export interface TranslationData {
  [key: string]: string | TranslationData;
}

/**
 * 语言变化事件回调
 */
export type LocaleChangeCallback = (locale: string) => void;

/**
 * 日期格式化选项
 */
export interface DateFormatOptions {
  /** 日期格式（默认："YYYY-MM-DD"） */
  date?: string;
  /** 时间格式（默认："HH:mm:ss"） */
  time?: string;
  /** 日期时间格式（默认："YYYY-MM-DD HH:mm:ss"） */
  datetime?: string;
}

/**
 * 数字格式化选项
 */
export interface NumberFormatOptions {
  /** 小数位数（默认：2） */
  decimals?: number;
  /** 千位分隔符（默认：","） */
  thousandsSeparator?: string;
  /** 小数分隔符（默认："."） */
  decimalSeparator?: string;
}

/**
 * i18n 配置选项
 */
export interface I18nOptions {
  /** 默认语言（默认："zh-CN"） */
  defaultLocale?: string;
  /** 支持的语言列表（默认：["zh-CN", "en-US"]） */
  locales?: string[];
  /** 初始翻译数据 */
  translations?: Record<string, TranslationData>;
  /** 日期格式化选项 */
  dateFormat?: DateFormatOptions;
  /** 数字格式化选项 */
  numberFormat?: NumberFormatOptions;
  /** 缺失翻译时的回退行为 */
  fallbackBehavior?: "key" | "empty" | "default";
  /** 是否启用 HTML 转义（安全防护，防止 XSS 攻击，默认：false） */
  escapeHtml?: boolean;
}

/**
 * i18n 服务接口
 * 定义核心的国际化服务方法
 */
export interface I18nService {
  /** 翻译函数 */
  t: (key: string, params?: TranslationParams) => string;
  /** 获取当前语言 */
  getLocale: () => string;
  /** 设置语言 */
  setLocale: (locale: string) => boolean;
  /** 获取支持的语言列表 */
  getLocales: () => string[];
  /** 检查语言是否支持 */
  isLocaleSupported: (locale: string) => boolean;
  /** 加载翻译数据 */
  loadTranslations: (locale: string, data: TranslationData) => void;
  /** 获取所有翻译数据 */
  getTranslations: (locale?: string) => TranslationData;
  /** 检查翻译键是否存在 */
  has: (key: string) => boolean;
  /** 格式化数字 */
  formatNumber: (value: number, options?: Partial<NumberFormatOptions>) => string;
  /** 格式化货币 */
  formatCurrency: (value: number, currency?: string) => string;
  /** 格式化日期 */
  formatDate: (date: Date | number, format?: "date" | "time" | "datetime" | string) => string;
  /** 格式化相对时间 */
  formatRelative: (date: Date | number) => string;
  /** 监听语言变化 */
  onChange: (callback: LocaleChangeCallback) => () => void;
  /** 移除所有监听器 */
  removeAllListeners: () => void;
}

/**
 * 全局翻译函数类型
 */
export type GlobalTranslateFunction = (
  key: string,
  params?: TranslationParams,
) => string;

/**
 * 全局 i18n 对象类型
 */
export interface GlobalI18n {
  $t?: GlobalTranslateFunction;
  $i18n?: I18nService;
}

/**
 * 全局类型声明
 *
 * 当导入 @dreamer/i18n 时，全局 $t 和 $i18n 类型自动可用
 * 无需额外配置或复制文件
 */
declare global {
  /**
   * 全局翻译函数
   *
   * 使用前需要先调用 i18n.install()
   *
   * @example
   * ```typescript
   * // 简单翻译
   * const hello = $t("hello");
   *
   * // 带参数插值
   * const welcome = $t("welcome", { name: "张三" });
   *
   * // 嵌套键
   * const menuHome = $t("menu.home");
   * ```
   */
  const $t: GlobalTranslateFunction | undefined;

  /**
   * 全局 i18n 服务实例
   *
   * 使用前需要先调用 i18n.install()
   *
   * @example
   * ```typescript
   * // 获取当前语言
   * const locale = $i18n?.getLocale();
   *
   * // 切换语言
   * $i18n?.setLocale("en-US");
   *
   * // 格式化
   * $i18n?.formatNumber(1234.56);
   * ```
   */
  const $i18n: I18nService | undefined;
}
