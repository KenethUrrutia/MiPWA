const CACHE_NAME = `temperature-converter-v1`;
const CACHE_URLS = [
	'/', // index
	'/converter.js', // css
	'/converter.css', // js
	'/index.html', // html
	'/manifest.json', // manifest
	'/icon512_rounded.png' // icon
];

// El evento 'install' se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', (event) => {
	// El Service Worker espera hasta que esté la caché
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			cache.addAll(CACHE_URLS).catch((err) => {
				console.error('Error al almacenar en caché', err);
			});
		})()
	);
});

// El evento 'fetch' se dispara cada vez que la aplicación hace una petición de red.
self.addEventListener('fetch', (event) => {
	// event.respondWith() nos permite modificar la respuesta a esta petición.
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);

			// busca en el cache una respuesta almacenada para esta URL.
			const cachedResponse = await cache.match(event.request);

			if (cachedResponse) {
				return cachedResponse;
			} else {
				try {
					const fetchResponse = await fetch(event.request);
					cache.put(event.request, fetchResponse.clone());
					return fetchResponse;
				} catch (e) {
					// Error
				}
			}
		})()
	);
});
