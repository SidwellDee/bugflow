import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { createStore } from "./store.js";
import { createApplication } from './application.js';
import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const origin=process.env.APP_ORIGIN||`http://127.0.0.1:${process.env.PORT||3000}`;
const parsedOrigin=new URL(origin);
if(parsedOrigin.origin!==origin||!['http:','https:'].includes(parsedOrigin.protocol))throw Error('APP_ORIGIN must be an origin without a trailing slash');
const store = createStore(process.env.BUGFLOW_DB || "bugflow.db");
const application=createApplication(store,{origin,clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,encryptionKey:process.env.TOKEN_ENCRYPTION_KEY});
const production = process.argv.includes("--production");
const vite = production
  ? null
  : await (
      await import("vite")
    ).createServer({ server: { middlewareMode: true }, appType: "custom" });
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  function send(body, status = 200, type = "application/json") {
    res.writeHead(status, {
      "Content-Type": type + "; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });
    res.end(type === "application/json" ? JSON.stringify(body) : body);
  }
  try {
    if(req.method==='GET'&&url.pathname==='/healthz'){
      store.db.prepare('SELECT 1').get();
      return send({status:'ok'});
    }
    if(url.pathname.startsWith('/api/'))return await application.handle(req,res,url,send);
    if (vite)
      return vite.middlewares(req, res, async () => {
        try {
          send(
            await vite.transformIndexHtml(
              req.url,
              await readFile("index.html", "utf8"),
            ),
            200,
            "text/html",
          );
        } catch (e) {
          send({ error: e.message }, 500);
        }
      });
    const file = resolve(
      "dist",
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (
      !file.startsWith(
        resolve("dist") +
          "/".replace("/", process.platform === "win32" ? "\\" : "/"),
      )
    )
      return send({ error: "Not found" }, 404);
    try {
      const body = await readFile(file);
      send(
        body,
        200,
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
        }[extname(file)] || "application/octet-stream",
      );
    } catch {
      return send({ error: "Not found" }, 404);
    }
  } catch (e) {
    send({ error: e.message }, 400);
  }
});
server.listen(Number(process.env.PORT) || 3000, process.env.HOST || "127.0.0.1", () =>
  console.log("BugFlow React: http://127.0.0.1:" + (process.env.PORT || 3000)),
);
