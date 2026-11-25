import fs from "node:fs";
const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
let out = [],
  para = [],
  code = [],
  incode = false,
  table = false;
const flush = () => {
  if (para.length) {
    out.push("<p>" + inline(para.join(" ")) + "</p>");
    para = [];
  }
};
for (const line of [
  ...fs.readFileSync("REPORT.md", "utf8").split(/\r?\n/),
  "",
]) {
  if (line.startsWith("```")) {
    flush();
    if (incode) {
      out.push("<pre>" + esc(code.join("\n")) + "</pre>");
      code = [];
    }
    incode = !incode;
    continue;
  }
  if (incode) {
    code.push(line);
    continue;
  }
  if (line.startsWith("|")) {
    flush();
    const cells = line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((x) => x.trim());
    if (cells.every((x) => /^[- :]+$/.test(x))) continue;
    const tag = table ? "td" : "th";
    if (!table) {
      out.push("<table>");
      table = true;
    }
    out.push(
      "<tr>" +
        cells.map((x) => `<${tag}>${inline(x)}</${tag}>`).join("") +
        "</tr>",
    );
    continue;
  }
  if (table) {
    out.push("</table>");
    table = false;
  }
  const h = line.match(/^(#+) (.*)/);
  if (h) {
    flush();
    out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
  } else if (!line.trim()) flush();
  else para.push(line);
}
fs.writeFileSync(
  "REPORT.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>BugFlow React development report</title><style>body{max-width:900px;margin:50px auto;padding:0 30px;font:16px/1.65 Georgia;color:#202731}h1,h2,h3{font-family:Arial;color:black;line-height:1.3;break-after:avoid}h2{margin-top:36px}table{border-collapse:collapse;width:100%;font:13px/1.5 Arial;margin:22px 0}td,th{border:1px solid #d9d9d9;padding:10px;text-align:left}th{background:#19344d;color:white}tr:nth-child(even){background:#f3f6f9}tr{break-inside:avoid}pre{white-space:pre-wrap;background:#f2f4f7;padding:20px;font:13px/1.6 monospace}@media print{body{margin:0;font-size:11pt}table{font-size:9pt}@page{size:A4;margin:20mm}}</style><body>' +
    out.join("") +
    "</body></html>",
);
