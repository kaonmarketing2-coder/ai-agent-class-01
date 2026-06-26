// Build self-contained HTML pages from src/*.jsx
//
// Inlines React 18 UMD + precompiled component code so the pages load
// with zero external requests (no CDN, no in-browser Babel).
//
// Usage:
//   npm install react@18 react-dom@18 @babel/core@7 @babel/preset-react@7
//   node build.cjs
const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");
const presetReact = require("@babel/preset-react");

const ROOT = __dirname;
const req = p => require.resolve(p);
const reactUMD = fs.readFileSync(path.join(path.dirname(req("react/package.json")), "umd/react.production.min.js"), "utf8");
const reactDomUMD = fs.readFileSync(path.join(path.dirname(req("react-dom/package.json")), "umd/react-dom.production.min.js"), "utf8");

const PAGES = [
  { src: "src/attendance.jsx", out: "attendance.html", title: "교육 참석 그룹 배정 제출 (Group 1·2)" },
  { src: "src/dashboard.jsx", out: "dashboard.html", title: "교육 배정 현황 대시보드 (Group 1·2)" },
  { src: "src/attendance_g345.jsx", out: "attendance_g345.html", title: "교육 참석 그룹 배정 제출 (Group 3·4·5)" },
  { src: "src/dashboard_g345.jsx", out: "dashboard_g345.html", title: "교육 배정 현황 대시보드 (Group 3·4·5)" },
];

for (const { src, out, title } of PAGES) {
  const jsx = fs.readFileSync(path.join(ROOT, src), "utf8");
  const { code } = babel.transform(jsx, {
    presets: [[presetReact, { runtime: "classic" }]],
    compact: false,
  });
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style> body { margin: 0; } </style>
</head>
<body>
  <div id="root"></div>
  <script>${reactUMD}</script>
  <script>${reactDomUMD}</script>
  <script>
${code}
  </script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, out), html);
  console.log(`${out}: ${(html.length / 1024).toFixed(0)}KB (compiled JS ${(code.length / 1024).toFixed(0)}KB)`);
}
