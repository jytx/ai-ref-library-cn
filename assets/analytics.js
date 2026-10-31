/**
 * 轻量埋点层（无依赖，纯前端）
 *
 * 用法：在 config.js 里配置 window.ANALYTICS
 *   provider: "none" | "ga4" | "baidu" | "umami" | "cloudflare"
 *   id:       对应平台的 ID / 站点 token
 *
 * 所有业务事件通过 window.track(name, params) 上报；
 * 无论是否配置平台，都会写入 window.__trackLog 便于本地调试（保留最近 200 条）。
 */
(function () {
  var cfg = window.ANALYTICS || {};
  var provider = cfg.provider || "none";
  var id = cfg.id || "";

  window.__trackLog = [];
  function log(name, params) {
    var rec = { t: Date.now(), name: name, params: params || {} };
    window.__trackLog.push(rec);
    if (window.__trackLog.length > 200) window.__trackLog.shift();
    if (window.__trackDebug) console.log("[track]", name, rec.params);
  }

  window.track = function (name, params) {
    try {
      log(name, params);
      if (provider === "ga4" && window.gtag) {
        window.gtag("event", name, params || {});
      } else if (provider === "baidu" && window._hmt) {
        var p = params || {};
        window._hmt.push(["_trackEvent", p.lib || "app", name, JSON.stringify(p)]);
      } else if (provider === "umami" && window.umami) {
        window.umami.track(name, params || {});
      }
    } catch (e) { /* 埋点不能影响主流程 */ }
  };

  function addScript(src, attrs) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }

  if (!id && provider !== "none") {
    console.warn("[analytics] provider =", provider, "但没有配置 id，已退化为本地日志");
    return;
  }

  if (provider === "ga4") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { send_page_view: true, anonymize_ip: true });
    addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id));
  } else if (provider === "baidu") {
    window._hmt = window._hmt || [];
    addScript("https://hm.baidu.com/hm.js?" + encodeURIComponent(id));
  } else if (provider === "umami") {
    addScript("https://cloud.umami.is/script.js", { "data-website-id": id });
  } else if (provider === "cloudflare") {
    addScript("https://static.cloudflareinsights.com/beacon.min.js", { "data-cf-beacon": JSON.stringify({ token: id }) });
  }
})();
