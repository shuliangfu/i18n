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
 * 提供对 I18n 实例方法的代理访问：优先转发到 globalThis.$i18n（即 install()
 * 挂载的实例），否则回退到默认单例 getI18n()。
 *
 * 【Why】原实现为每个 I18nService 方法手写一份「取全局 → 判空 → 转发/回退」
 *   样板（200+ 行），方法越多越易漏写/写错。用 Proxy 统一在 get 陷阱里解析
 *   目标实例并绑定 this，行为与原实现等价，但收敛到一处。
 * 【Invariant】每次属性访问解析当前目标（g.$i18n ?? getI18n()），故 install/
 *   uninstall 切换后立即生效；方法以 bind(target) 返回，解构调用仍保有 this。
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
type AnyService = I18nService & Record<string | symbol, unknown>;
export const $i18n: I18nService = new Proxy({} as I18nService, {
  get(_target, prop: string | symbol): unknown {
    const g = getGlobalRef();
    const target = (g.$i18n ?? getI18n()) as AnyService;
    const value = target[prop];
    // 方法绑定 this 后返回，确保解构调用（const t = $i18n.t; t("k")）仍正确
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(target)
      : value;
  },
});

// 默认导出
export default I18n;
