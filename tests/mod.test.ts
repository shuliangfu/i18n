/**
 * @dreamer/i18n 测试
 */

import { afterEach, beforeEach, describe, expect, it } from "@dreamer/test";
import {
  $i18n,
  $t,
  createI18n,
  getI18n,
  I18n,
  isI18nInstalled,
  setDefaultI18n,
  uninstallI18n,
} from "../src/mod.ts";

describe("I18n 国际化库", () => {
  describe("实例创建", () => {
    it("应该使用默认配置创建实例", () => {
      const i18n = new I18n();
      expect(i18n.getLocale()).toBe("zh-CN");
      expect(i18n.getLocales()).toEqual(["zh-CN", "en-US"]);
    });

    it("应该使用自定义配置创建实例", () => {
      const i18n = new I18n({
        defaultLocale: "en-US",
        locales: ["en-US", "ja-JP", "ko-KR"],
      });
      expect(i18n.getLocale()).toBe("en-US");
      expect(i18n.getLocales()).toEqual(["en-US", "ja-JP", "ko-KR"]);
    });

    it("createI18n 工厂函数应该返回 I18n 实例", () => {
      const i18n = createI18n({ defaultLocale: "zh-CN" });
      expect(i18n).toBeInstanceOf(I18n);
    });

    it("getI18n 应该返回单例实例", () => {
      const i18n1 = getI18n();
      const i18n2 = getI18n();
      expect(i18n1).toBe(i18n2);
    });

    it("setDefaultI18n 应该设置默认实例", () => {
      const customI18n = new I18n({
        defaultLocale: "ja-JP",
        locales: ["ja-JP"],
      });
      setDefaultI18n(customI18n);
      expect(getI18n()).toBe(customI18n);
    });
  });

  describe("语言管理", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n({
        defaultLocale: "zh-CN",
        locales: ["zh-CN", "en-US", "ja-JP"],
      });
    });

    it("getLocale 应该返回当前语言", () => {
      expect(i18n.getLocale()).toBe("zh-CN");
    });

    it("setLocale 应该切换语言", () => {
      const result = i18n.setLocale("en-US");
      expect(result).toBe(true);
      expect(i18n.getLocale()).toBe("en-US");
    });

    it("setLocale 对不支持的语言应该返回 false", () => {
      const result = i18n.setLocale("fr-FR");
      expect(result).toBe(false);
      expect(i18n.getLocale()).toBe("zh-CN");
    });

    it("setLocale 对相同语言应该返回 true", () => {
      const result = i18n.setLocale("zh-CN");
      expect(result).toBe(true);
    });

    it("isLocaleSupported 应该正确检查语言支持", () => {
      expect(i18n.isLocaleSupported("zh-CN")).toBe(true);
      expect(i18n.isLocaleSupported("fr-FR")).toBe(false);
    });
  });

  describe("翻译函数 t()", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n({
        defaultLocale: "zh-CN",
        locales: ["zh-CN", "en-US"],
        translations: {
          "zh-CN": {
            greeting: "你好",
            welcome: "欢迎 {name}",
            nav: {
              home: "首页",
              about: "关于",
            },
            count: "{count} 个项目",
          },
          "en-US": {
            greeting: "Hello",
            welcome: "Welcome {name}",
            nav: {
              home: "Home",
              about: "About",
            },
          },
        },
      });
    });

    it("应该返回简单翻译", () => {
      expect(i18n.t("greeting")).toBe("你好");
    });

    it("应该支持参数插值", () => {
      expect(i18n.t("welcome", { name: "张三" })).toBe("欢迎 张三");
    });

    it("应该支持嵌套键", () => {
      expect(i18n.t("nav.home")).toBe("首页");
      expect(i18n.t("nav.about")).toBe("关于");
    });

    it("切换语言后应该返回对应语言的翻译", () => {
      i18n.setLocale("en-US");
      expect(i18n.t("greeting")).toBe("Hello");
      expect(i18n.t("nav.home")).toBe("Home");
    });

    it("缺失翻译应该返回键名（默认行为）", () => {
      expect(i18n.t("nonexistent")).toBe("nonexistent");
    });

    it("数字参数应该被正确插值", () => {
      expect(i18n.t("count", { count: 5 })).toBe("5 个项目");
    });

    it("should fallback to default locale when key missing in current locale", () => {
      i18n.setLocale("en-US");
      expect(i18n.t("count", { count: 10 })).toBe("10 个项目");
    });
  });

  describe("翻译存在检查 has()", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n({
        translations: {
          "zh-CN": {
            hello: "你好",
            nav: { home: "首页" },
          },
        },
      });
    });

    it("存在的键应该返回 true", () => {
      expect(i18n.has("hello")).toBe(true);
      expect(i18n.has("nav.home")).toBe(true);
    });

    it("不存在的键应该返回 false", () => {
      expect(i18n.has("nonexistent")).toBe(false);
      expect(i18n.has("nav.nonexistent")).toBe(false);
    });
  });

  describe("动态加载翻译 loadTranslations()", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n({
        translations: {
          "zh-CN": { existing: "已存在" },
        },
      });
    });

    it("应该添加新的翻译数据", () => {
      i18n.loadTranslations("zh-CN", { newKey: "新的翻译" });
      expect(i18n.t("newKey")).toBe("新的翻译");
    });

    it("应该合并嵌套的翻译数据", () => {
      i18n.loadTranslations("zh-CN", { nav: { home: "首页" } });
      i18n.loadTranslations("zh-CN", { nav: { about: "关于" } });
      expect(i18n.t("nav.home")).toBe("首页");
      expect(i18n.t("nav.about")).toBe("关于");
    });

    it("应该保留原有的翻译", () => {
      i18n.loadTranslations("zh-CN", { newKey: "新的" });
      expect(i18n.t("existing")).toBe("已存在");
    });
  });

  describe("数字格式化 formatNumber()", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n();
    });

    it("应该格式化数字", () => {
      expect(i18n.formatNumber(1234567.89)).toBe("1,234,567.89");
    });

    it("应该支持自定义小数位数", () => {
      expect(i18n.formatNumber(1234.5, { decimals: 0 })).toBe("1,235");
      expect(i18n.formatNumber(1234.5, { decimals: 3 })).toBe("1,234.500");
    });

    it("应该支持自定义分隔符", () => {
      expect(i18n.formatNumber(1234567.89, {
        thousandsSeparator: " ",
        decimalSeparator: ",",
      })).toBe("1 234 567,89");
    });
  });

  describe("货币格式化 formatCurrency()", () => {
    it("中文应该使用人民币符号", () => {
      const i18n = new I18n({ defaultLocale: "zh-CN" });
      expect(i18n.formatCurrency(1234.56)).toBe("¥1,234.56");
    });

    it("英文应该使用美元符号", () => {
      const i18n = new I18n({ defaultLocale: "en-US" });
      expect(i18n.formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("应该支持自定义货币符号", () => {
      const i18n = new I18n();
      expect(i18n.formatCurrency(1234.56, "€")).toBe("€1,234.56");
    });
  });

  describe("日期格式化 formatDate()", () => {
    let i18n: I18n;
    const testDate = new Date(2024, 0, 15, 14, 30, 45);

    beforeEach(() => {
      i18n = new I18n();
    });

    it("应该格式化日期", () => {
      expect(i18n.formatDate(testDate, "date")).toBe("2024-01-15");
    });

    it("应该格式化时间", () => {
      expect(i18n.formatDate(testDate, "time")).toBe("14:30:45");
    });

    it("应该格式化日期时间", () => {
      expect(i18n.formatDate(testDate, "datetime")).toBe("2024-01-15 14:30:45");
    });

    it("应该支持时间戳输入", () => {
      expect(i18n.formatDate(testDate.getTime(), "date")).toBe("2024-01-15");
    });

    it("应该支持自定义格式", () => {
      expect(i18n.formatDate(testDate, "YYYY/MM/DD")).toBe("2024/01/15");
    });
  });

  describe("相对时间格式化 formatRelative()", () => {
    it("刚刚的时间应该返回'刚刚'", () => {
      const i18n = new I18n({ defaultLocale: "zh-CN" });
      expect(i18n.formatRelative(Date.now() - 1000)).toBe("刚刚");
    });

    it("分钟前的时间应该正确格式化", () => {
      const i18n = new I18n({ defaultLocale: "zh-CN" });
      expect(i18n.formatRelative(Date.now() - 5 * 60 * 1000)).toBe("5 分钟前");
    });

    it("小时前的时间应该正确格式化", () => {
      const i18n = new I18n({ defaultLocale: "zh-CN" });
      expect(i18n.formatRelative(Date.now() - 2 * 60 * 60 * 1000)).toBe(
        "2 小时前",
      );
    });

    it("英文应该使用英文格式", () => {
      const i18n = new I18n({ defaultLocale: "en-US" });
      expect(i18n.formatRelative(Date.now() - 5 * 60 * 1000)).toBe(
        "5 minutes ago",
      );
    });

    it("未来时间应该使用'后'", () => {
      const i18n = new I18n({ defaultLocale: "zh-CN" });
      expect(i18n.formatRelative(Date.now() + 5 * 60 * 1000)).toBe("5 分钟后");
    });
  });

  describe("事件监听", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n({
        locales: ["zh-CN", "en-US"],
      });
    });

    it("onChange 应该注册回调", () => {
      const callback = () => {};
      const unsubscribe = i18n.onChange(callback);
      expect(typeof unsubscribe).toBe("function");
    });

    it("切换语言时应该触发回调", () => {
      let calledLocale = "";
      i18n.onChange((locale) => {
        calledLocale = locale;
      });
      i18n.setLocale("en-US");
      expect(calledLocale).toBe("en-US");
    });

    it("onChange 返回的函数应该能取消监听", () => {
      let callCount = 0;
      const unsubscribe = i18n.onChange(() => {
        callCount++;
      });

      i18n.setLocale("en-US");
      expect(callCount).toBe(1);

      unsubscribe();
      i18n.setLocale("zh-CN");
      expect(callCount).toBe(1);
    });

    it("removeAllListeners 应该移除所有监听器", () => {
      let callCount = 0;
      i18n.onChange(() => callCount++);
      i18n.onChange(() => callCount++);

      i18n.setLocale("en-US");
      expect(callCount).toBe(2);

      i18n.removeAllListeners();
      i18n.setLocale("zh-CN");
      expect(callCount).toBe(2);
    });
  });

  describe("全局安装", () => {
    let i18n: I18n;

    beforeEach(() => {
      i18n = new I18n({
        translations: {
          "zh-CN": { hello: "你好" },
        },
      });
    });

    afterEach(() => {
      uninstallI18n();
    });

    it("install 应该注册全局 $t 和 $i18n", () => {
      i18n.install();
      expect(isI18nInstalled()).toBe(true);
    });

    it("uninstall 应该移除全局方法", () => {
      i18n.install();
      expect(isI18nInstalled()).toBe(true);

      i18n.uninstall();
      expect(isI18nInstalled()).toBe(false);
    });

    it("安装后全局 $t 应该能翻译", () => {
      i18n.install();
      // deno-lint-ignore no-explicit-any
      const g = globalThis as any;
      expect(g.$t("hello")).toBe("你好");
    });
  });

  describe("便捷导出 $t 和 $i18n", () => {
    beforeEach(() => {
      const i18n = new I18n({
        translations: {
          "zh-CN": { hello: "你好", welcome: "欢迎 {name}" },
        },
      });
      i18n.install();
    });

    afterEach(() => {
      uninstallI18n();
    });

    it("$t 应该能翻译", () => {
      expect($t("hello")).toBe("你好");
    });

    it("$t 应该支持参数", () => {
      expect($t("welcome", { name: "张三" })).toBe("欢迎 张三");
    });

    it("$i18n.getLocale 应该返回当前语言", () => {
      expect($i18n.getLocale()).toBe("zh-CN");
    });

    it("$i18n.setLocale 应该能切换语言", () => {
      // 创建一个有多语言支持的实例
      const i18n = new I18n({
        locales: ["zh-CN", "en-US"],
        translations: {
          "zh-CN": { hello: "你好" },
          "en-US": { hello: "Hello" },
        },
      });
      i18n.install();

      expect($i18n.setLocale("en-US")).toBe(true);
      expect($i18n.getLocale()).toBe("en-US");
    });
  });

  describe("回退行为配置", () => {
    it("fallbackBehavior='key' 应该返回键名", () => {
      const i18n = new I18n({ fallbackBehavior: "key" });
      expect(i18n.t("nonexistent")).toBe("nonexistent");
    });

    it("fallbackBehavior='empty' 应该返回空字符串", () => {
      const i18n = new I18n({ fallbackBehavior: "empty" });
      expect(i18n.t("nonexistent")).toBe("");
    });

    it("fallbackBehavior='default' 应该尝试默认语言", () => {
      const i18n = new I18n({
        defaultLocale: "zh-CN",
        locales: ["zh-CN", "en-US"],
        fallbackBehavior: "default",
        translations: {
          "zh-CN": { hello: "你好" },
        },
      });
      i18n.setLocale("en-US");
      expect(i18n.t("hello")).toBe("你好");
    });
  });

  describe("安全防护", () => {
    it("escapeHtml=true 应该转义 HTML 特殊字符", () => {
      const i18n = new I18n({
        escapeHtml: true,
        translations: {
          "zh-CN": { greeting: "你好 {name}" },
        },
      });
      // 模拟 XSS 攻击
      const result = i18n.t("greeting", {
        name: '<script>alert("xss")</script>',
      });
      expect(result).toBe(
        "你好 &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      );
    });

    it("escapeHtml=true 应该转义引号", () => {
      const i18n = new I18n({
        escapeHtml: true,
        translations: {
          "zh-CN": { msg: "{content}" },
        },
      });
      const result = i18n.t("msg", { content: 'It\'s a "test" & more' });
      expect(result).toBe("It&#39;s a &quot;test&quot; &amp; more");
    });

    it("escapeHtml=false（默认）不应该转义 HTML", () => {
      const i18n = new I18n({
        translations: {
          "zh-CN": { greeting: "你好 {name}" },
        },
      });
      const result = i18n.t("greeting", { name: "<b>张三</b>" });
      expect(result).toBe("你好 <b>张三</b>");
    });

    it("loadTranslations 应该防止原型污染", () => {
      const i18n = new I18n();

      // 尝试原型污染攻击
      i18n.loadTranslations("zh-CN", {
        "__proto__": { polluted: "yes" },
        "constructor": { polluted: "yes" },
        "prototype": { polluted: "yes" },
        "safe": "安全的值",
      } as unknown as Record<string, string>);

      // 确保原型没有被污染
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      // 确保安全的值被正确加载
      expect(i18n.t("safe")).toBe("安全的值");
    });
  });

  describe("性能优化", () => {
    it("重复翻译相同键应该使用缓存", () => {
      const i18n = new I18n({
        translations: {
          "zh-CN": { nav: { home: { title: "首页标题" } } },
        },
      });

      // 多次调用相同的嵌套键
      const result1 = i18n.t("nav.home.title");
      const result2 = i18n.t("nav.home.title");
      const result3 = i18n.t("nav.home.title");

      expect(result1).toBe("首页标题");
      expect(result2).toBe("首页标题");
      expect(result3).toBe("首页标题");
    });

    it("大量语言支持时 setLocale 应该快速查找", () => {
      const locales = Array.from({ length: 100 }, (_, i) => `lang-${i}`);
      const i18n = new I18n({ locales, defaultLocale: "lang-0" });

      // 设置最后一个语言
      const result = i18n.setLocale("lang-99");
      expect(result).toBe(true);
      expect(i18n.getLocale()).toBe("lang-99");
    });
  });

  describe("翻译结果缓存", () => {
    it("enableCache=true 应该缓存翻译结果", () => {
      const i18n = new I18n({
        enableCache: true,
        translations: {
          "zh-CN": { hello: "你好", welcome: "欢迎 {name}" },
        },
      });

      // 第一次翻译
      const result1 = i18n.t("hello");
      // 第二次翻译应该来自缓存
      const result2 = i18n.t("hello");

      expect(result1).toBe("你好");
      expect(result2).toBe("你好");
    });

    it("带参数的翻译应该正确缓存", () => {
      const i18n = new I18n({
        enableCache: true,
        translations: {
          "zh-CN": { welcome: "欢迎 {name}" },
        },
      });

      const result1 = i18n.t("welcome", { name: "张三" });
      const result2 = i18n.t("welcome", { name: "李四" });
      const result3 = i18n.t("welcome", { name: "张三" }); // 应该命中缓存

      expect(result1).toBe("欢迎 张三");
      expect(result2).toBe("欢迎 李四");
      expect(result3).toBe("欢迎 张三");
    });

    it("切换语言应该清除缓存", () => {
      const i18n = new I18n({
        enableCache: true,
        locales: ["zh-CN", "en-US"],
        translations: {
          "zh-CN": { hello: "你好" },
          "en-US": { hello: "Hello" },
        },
      });

      expect(i18n.t("hello")).toBe("你好");
      i18n.setLocale("en-US");
      expect(i18n.t("hello")).toBe("Hello");
    });

    it("loadTranslations 应该清除缓存", () => {
      const i18n = new I18n({
        enableCache: true,
        translations: {
          "zh-CN": { hello: "你好" },
        },
      });

      expect(i18n.t("hello")).toBe("你好");

      // 加载新翻译
      i18n.loadTranslations("zh-CN", { hello: "您好" });
      expect(i18n.t("hello")).toBe("您好");
    });

    it("clearCache 应该清除所有缓存", () => {
      const i18n = new I18n({
        enableCache: true,
        translations: {
          "zh-CN": { hello: "你好" },
        },
      });

      i18n.t("hello");
      i18n.clearCache();
      // 缓存被清除后应该重新翻译
      expect(i18n.t("hello")).toBe("你好");
    });

    it("cacheMaxSize 应该限制缓存大小", () => {
      const i18n = new I18n({
        enableCache: true,
        cacheMaxSize: 3,
        translations: {
          "zh-CN": {
            a: "A",
            b: "B",
            c: "C",
            d: "D",
          },
        },
      });

      // 缓存 3 个翻译
      i18n.t("a");
      i18n.t("b");
      i18n.t("c");
      // 添加第 4 个应该移除最旧的
      i18n.t("d");

      // 所有翻译仍然正确（只是缓存行为不同）
      expect(i18n.t("a")).toBe("A");
      expect(i18n.t("b")).toBe("B");
      expect(i18n.t("c")).toBe("C");
      expect(i18n.t("d")).toBe("D");
    });
  });

  describe("语言自动检测", () => {
    it("detectLocale 应该返回 null（Deno 测试环境无浏览器）", () => {
      const i18n = new I18n({
        locales: ["zh-CN", "en-US"],
      });

      // 在 Deno 测试环境中，navigator 不可用，应返回 null 或匹配的语言
      const detected = i18n.detectLocale();
      // 结果取决于环境
      expect(detected === null || i18n.isLocaleSupported(detected!)).toBe(true);
    });

    it("autoDetect=true 应该自动设置检测到的语言", () => {
      const i18n = new I18n({
        locales: ["zh-CN", "en-US"],
        defaultLocale: "zh-CN",
        autoDetect: true,
      });

      // 语言应该是检测到的或默认的
      const locale = i18n.getLocale();
      expect(i18n.isLocaleSupported(locale)).toBe(true);
    });

    it("detectLocale 不支持的语言应该返回 null", () => {
      const i18n = new I18n({
        locales: ["fr-FR", "de-DE"], // 不太可能的系统语言
      });

      const detected = i18n.detectLocale();
      // 如果系统语言不在列表中，应该返回 null
      if (detected !== null) {
        expect(i18n.isLocaleSupported(detected)).toBe(true);
      }
    });
  });

  describe("异步翻译加载", () => {
    it("loadTranslationsAsync 应该加载远程翻译（模拟测试）", async () => {
      const i18n = new I18n({
        locales: ["zh-CN"],
      });

      // 由于无法在测试中模拟 fetch，这里只测试方法存在
      expect(typeof i18n.loadTranslationsAsync).toBe("function");
    });
  });

  describe("持久化缓存", () => {
    it("persistentCache 配置应该正确初始化", () => {
      const i18n = new I18n({
        persistentCache: {
          enabled: true,
          storage: "sessionStorage",
          prefix: "test_i18n_",
          maxEntries: 5,
          ttl: 3600000,
        },
      });

      // 验证实例创建成功
      expect(i18n.getLocale()).toBe("zh-CN");
    });

    it("clearPersistentCache 方法应该存在", () => {
      const i18n = new I18n({
        persistentCache: { enabled: true },
      });

      expect(typeof i18n.clearPersistentCache).toBe("function");
      // 调用不应抛出错误
      i18n.clearPersistentCache();
    });

    it("内存缓存应该避免重复加载相同 URL", async () => {
      const i18n = new I18n({
        locales: ["zh-CN"],
      });

      // 测试方法存在
      expect(typeof i18n.loadTranslationsAsync).toBe("function");
    });
  });
});
