import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "@fontsource-variable/golos-text";
import "./styles.css";
import { startAnalytics } from "./site.js";

startAnalytics();

// Pages are prerendered at build time: take over that markup instead of drawing it again.
const root = document.getElementById("root");
// The prerendered file names its page: it then works under any address, not only /prices.html.
const app = <React.StrictMode><App path={root.dataset.page || undefined} /></React.StrictMode>;
if (root.hasChildNodes()) hydrateRoot(root, app); else createRoot(root).render(app);
