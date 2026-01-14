const loadedScripts = new Set();
const loadedStyles = new Set();

export function loadScript(src) {
	return new Promise((resolve, reject) => {
		if (loadedScripts.has(src)) {
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.src = src;
		script.async = true;
		script.onload = () => {
			loadedScripts.add(src);
			resolve();
		};
		script.onerror = reject;
		document.head.appendChild(script);

		console.log("Loading script: " + src);
	});
}

export function loadStyle(href) {
	return new Promise((resolve, reject) => {
		if (loadedStyles.has(href)) {
			resolve();
			return;
		}
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = href;
		link.onload = () => {
			loadedStyles.add(href);
			resolve();
		};
		link.onerror = reject;
		document.head.appendChild(link);

		console.log("Loading style: " + href);
	});
}