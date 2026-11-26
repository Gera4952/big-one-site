#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
// Real HTML entry for direct navigation/refresh on static hosts and our server, with its own
// title, description and canonical address so search engines treat it as a separate page.
const html = readFileSync(index, "utf8");
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const pricesHtml = html
  .replace(/<title>[^<]*<\/title>/, "<title>Цены на ремонт автомобилей — The Big One Garage, Соколиная Гора</title>")
  .replace(/(<meta name="description" content=")[^"]*/, "$1Цены на ремонт и обслуживание автомобилей в The Big One Garage: шиномонтаж, двигатель, подвеска, тормоза, электрика и другие работы. Соколиная Гора, Москва.")
  .replace(/(<link rel="canonical" href=")[^"]*/, `$1${canonical ? `${canonical}prices.html` : "prices.html"}`)
  .replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical ? `${canonical}prices.html` : "prices.html"}`);
writeFileSync(path.join(dist, "client", "prices.html"), pricesHtml);

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
