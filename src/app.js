import "./css/styles.css";
import "./css/responsive.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { initTabs } from "./tabs.js";

document.addEventListener("DOMContentLoaded", async () => {
	await initTabs();
});