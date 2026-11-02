/*
 * Generate stories.html from the dataset inside map.html.
 * Usage: node scripts/build-stories.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mapPath = path.join(root, "map.html");
const outPath = path.join(root, "stories.html");
const html = fs.readFileSync(mapPath, "utf8");

const start = html.indexOf("const CATS =");
const end = html.indexOf("(function(){");
if (start < 0 || end < 0 || end <= start) {
  throw new Error("Could not locate the dataset in map.html");
}
const dataCode = html.slice(start, end);
const CATS = eval(dataCode + "; CATS");
const SITES = eval(dataCode + "; SITES");

const PROV_ORDER = ["北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江", "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州", "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"];

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tagClass(cat) {
  return "tag tag-" + cat;
}

function yearText(y) {
  return y == null ? "年代不详" : y + "年";
}

const groups = {};
SITES.forEach((site) => {
  (groups[site.p] = groups[site.p] || []).push(site);
});

const totalStories = SITES.filter((s) => s.st).length;

let body = "";
PROV_ORDER.forEach((prov) => {
  const sites = groups[prov];
  if (!sites || !sites.length) return;
  sites.sort((a, b) => {
    if (!!b.major !== !!a.major) return b.major ? 1 : -1;
    return (a.c || "").localeCompare(b.c || "", "zh") || a.n.localeCompare(b.n, "zh");
  });
  body += '\n<section class="province-block" data-prov="' + esc(prov) + '">\n';
  body += '  <h2 class="province-title">' + esc(prov) + " <small>" + sites.length + " 处</small></h2>\n";
  body += '  <div class="story-list">\n';
  sites.forEach((site) => {
    const tags = site.cat.map((cat) => '<span class="' + tagClass(cat) + '">' + esc(CATS[cat].name) + "</span>").join("");
    const majorTag = site.major ? '<span class="tag tag-major">重点</span>' : "";
    const searchText = [site.n, site.p, site.c, site.m, site.d, site.st, site.cat.map((c) => CATS[c].name).join(" ")].join(" ");
    body += '    <article class="story-card" id="' + esc(site.id) + '" data-prov="' + esc(site.p) + '" data-text="' + esc(searchText) + '">\n';
    body += '      <div class="story-meta">' + tags + majorTag + "<span>" + esc(site.p) + " · " + esc(site.c) + "</span><span>" + esc(yearText(site.y)) + "</span></div>\n";
    body += '      <h3><a href="map.html#' + esc(site.id) + '">' + esc(site.n) + "</a></h3>\n";
    body += '      <p class="desc">' + esc(site.d) + "</p>\n";
    body += '      <p class="body">' + esc(site.st) + "</p>\n";
    body += '      <a class="story-link" href="map.html#' + esc(site.id) + '">在地图上定位</a>\n';
    body += "    </article>\n";
  });
  body += "  </div>\n</section>\n";
});

const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>故事档案 | 山河印记 · 毛泽东塑像与红色地标地图</title>
<meta name="description" content="按省份浏览中国大陆 99 处毛泽东塑像、铜像、纪念地与标语题词背后的故事，支持关键词与省份筛选。">
<meta name="theme-color" content="#a92d24">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="index.html" aria-label="山河印记首页">
      <span class="seal">毛</span>
      <span class="brand-text"><b>山河印记</b><span>MAO MEMORIAL MAP</span></span>
    </a>
    <button class="nav-toggle" type="button" aria-label="打开导航" aria-expanded="false">☰</button>
    <nav class="nav" aria-label="主导航">
      <a href="index.html">首页</a>
      <a href="map.html">交互地图</a>
      <a href="stories.html" class="active">故事档案</a>
      <a href="about.html">关于与来源</a>
      <a class="nav-gh" href="https://github.com/e2168708352-web/mao-memorial-map" target="_blank" rel="noopener">GitHub ↗</a>
    </nav>
  </div>
</header>

<main>
  <section class="page-hero">
    <p class="eyebrow">STORY ARCHIVE · ${totalStories} STORIES</p>
    <h1>${totalStories} 段故事，<em>一张可读的地图</em></h1>
    <p>按省份整理全部地点的背景故事。可以搜索人名、事件、口号，也可以只看某个省份；每张卡片都能回到地图上的具体位置。</p>
  </section>

  <div class="wrap">
    <div class="story-toolbar">
      <div class="story-search">
        <span class="ico">⌕</span>
        <input id="story-search" type="search" placeholder="搜索地点、人物、事件、口号…" autocomplete="off" aria-label="搜索故事">
        <kbd>/</kbd>
      </div>
      <select id="story-prov" aria-label="按省份筛选"><option value="all">全部省份</option></select>
      <button class="btn btn-ghost" id="story-random" type="button">随机读一段</button>
      <span class="story-count" id="story-count">显示 <b>${totalStories}</b> / ${totalStories} 段</span>
    </div>
    <p class="story-tools-note">故事依据公开报道、校史、地方志与纪念馆展陈整理；涉及民间传说或不同说法的，文中用“相传”“当地流传”等字样提示。</p>
    <div class="empty-state" id="story-empty">没有找到匹配的故事。<br>试试更短的关键词，或把省份切换为“全部省份”。</div>
${body}
  </div>
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <span class="seal">毛</span>
      <div><b>山河印记</b><span>MAO MEMORIAL MAP</span></div>
    </div>
    <div class="footer-links">
      <a href="index.html">首页</a>
      <a href="map.html">交互地图</a>
      <a href="stories.html">故事档案</a>
      <a href="about.html">关于与来源</a>
      <a href="https://github.com/e2168708352-web/mao-memorial-map" target="_blank" rel="noopener">GitHub ↗</a>
    </div>
    <p class="footer-note">非官方完整名录，仅供参观、研究与学习参考。塑像可能迁移、拆除或修缮，实地到访前请核实开放信息。故事中的年代、人物与细节可能存在不同版本。© <span data-year>2026</span> 山河印记 · 代码以 MIT 许可证开源。</p>
  </div>
</footer>
<script src="assets/site.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(outPath, page, "utf8");
console.log("Wrote " + outPath + " (" + SITES.length + " sites, " + totalStories + " stories)");
