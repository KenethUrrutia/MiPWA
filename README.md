# Guía para crear una PWA (Progressive Web App) simple

## Paso 1: Inicio de un servidor web

Para comenzar el desarrollo de la PWA, se puede utilizar un servidor web local con la herramienta `http-server` o `live-server`.

Primero, se crea el directorio del proyecto y se accede a él:

```bash
mkdir MiPWA
cd MiPWA
```

Luego, se inicia el servidor utilizando `http-server` de Node.js:

```bash
npx http-server
```

> **Nota:** Los Service Workers requieren HTTPS. Para pruebas o despliegue en producción, se recomienda alojar la aplicación en GitHub Pages (que admite HTTPS) o utilizar un certificado TLS con Let's Encrypt.

---

## Paso 2: Crear la página de inicio de la aplicación

Crear un archivo `index.html` con el siguiente contenido:

```html
<!DOCTYPE html>
<html lang="en-US" dir="ltr">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<link rel="shortcut icon" href="https://c.s-microsoft.com/favicon.ico?v2" />
		<title>Temperature converter</title>
	</head>
	<body>
		<h1>Temperature converter</h1>
	</body>
</html>
```

---

## Paso 3: Crear un manifiesto de aplicación web

Se genera un archivo `manifest.json` usando una herramienta como [Progressier Manifest Generator](https://progressier.com/pwa-manifest-generator).

Después de descargar y descomprimir los archivos, se copia `manifest.json` al directorio raíz del proyecto.

Vincular el manifiesto desde `index.html` agregando lo siguiente dentro de `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
```

---

## Paso 4: Crear la interfaz de usuario

Reemplazar el `<h1>` de `index.html` con el siguiente formulario:

```html
<form id="converter">
	<label for="input-temp">temperature</label>
	<input type="text" id="input-temp" name="input-temp" value="20" />
	<label for="input-unit">from</label>
	<select id="input-unit" name="input-unit">
		<option value="c" selected>Celsius</option>
		<option value="f">Fahrenheit</option>
		<option value="k">Kelvin</option>
	</select>
	<label for="output-unit">to</label>
	<select id="output-unit" name="output-unit">
		<option value="c">Celsius</option>
		<option value="f" selected>Fahrenheit</option>
		<option value="k">Kelvin</option>
	</select>
	<output name="output-temp" id="output-temp" for="input-temp input-unit output-unit">68 F</output>
</form>
```

Crear el archivo `converter.js`:

```javascript
const inputField = document.getElementById('input-temp');
const fromUnitField = document.getElementById('input-unit');
const toUnitField = document.getElementById('output-unit');
const outputField = document.getElementById('output-temp');
const form = document.getElementById('converter');

function convertTemp(value, fromUnit, toUnit) {
	if (fromUnit === 'c') {
		if (toUnit === 'f') return (value * 9) / 5 + 32;
		if (toUnit === 'k') return value + 273.15;
		return value;
	}
	if (fromUnit === 'f') {
		if (toUnit === 'c') return ((value - 32) * 5) / 9;
		if (toUnit === 'k') return ((value + 459.67) * 5) / 9;
		return value;
	}
	if (fromUnit === 'k') {
		if (toUnit === 'c') return value - 273.15;
		if (toUnit === 'f') return (value * 9) / 5 - 459.67;
		return value;
	}
	throw new Error('Invalid unit');
}

form.addEventListener('input', () => {
	const inputTemp = parseFloat(inputField.value);
	const fromUnit = fromUnitField.value;
	const toUnit = toUnitField.value;

	const outputTemp = convertTemp(inputTemp, fromUnit, toUnit);
	outputField.value = Math.round(outputTemp * 100) / 100 + ' ' + toUnit.toUpperCase();
});
```

Agregar el script al final del `body` en `index.html`:

```html
<script src="converter.js"></script>
```

Crear el archivo `converter.css`:

```css
html {
	background: rgb(243, 243, 243);
	font-family: system-ui, sans-serif;
	font-size: 15pt;
}

html,
body {
	height: 100%;
	margin: 0;
}

body {
	display: grid;
	place-items: center;
}

#converter {
	width: 15rem;
	padding: 2rem;
	border-radius: 0.5rem;
	box-shadow: 0 0 2rem 0 #0001;
	display: flex;
	flex-direction: column;
	align-items: center;
}

#converter input,
#converter select {
	font-family: inherit;
	font-size: inherit;
	margin-block-end: 1rem;
	text-align: center;
	width: 10rem;
}

#converter #output-temp {
	font-size: 2rem;
	font-weight: bold;
}
```

Vincular los estilos en `index.html` dentro de `<head>`:

```html
<link rel="stylesheet" href="converter.css" />
```

---

## Paso 5: Agregar un Service Worker

Crear el archivo `sw.js`:

```javascript
const CACHE_NAME = `temperature-converter-v1`;
const CACHE_URLS = [
	'./',
	'./index.html',
	'./converter.js',
	'./converter.css',
	'./manifest.json',
	'./icon512_rounded.png'
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
```

Registrar el Service Worker en `index.html`:

```html
<script>
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('./sw.js', { scope: '/' })
			.then((registration) => {
				console.log('ServiceWorker registration successful with scope: ', registration.scope);
			})
			.catch((error) => {
				console.log('ServiceWorker registration failed: ', error);
			});
	}
</script>
```

---

## Paso 6: Publicar en GitHub Pages

Para desplegar la PWA en GitHub Pages:

1. Subir todos los archivos del proyecto a un repositorio de GitHub.
2. Ir a la configuración del repositorio.
3. Buscar la sección **Pages**.
4. Seleccionar la rama (por ejemplo `main`) y la carpeta raíz (`/`).
5. Guardar y copiar la URL generada.

La aplicación ahora está disponible con HTTPS y lista para instalarse como PWA.

---

## Paso 7: Instalación de la aplicación

Al tener un manifiesto y un Service Worker activo, el navegador permitirá instalar la PWA.

### Firefox (escritorio)

Firefox no incluye soporte nativo para instalar aplicaciones como PWA. Para habilitar esta función, es necesario instalar una extensión adicional:

- **[PWA for Firefox](https://addons.mozilla.org/es-ES/firefox/addon/pwas-for-firefox/)**

Esta extensión requiere una aplicación auxiliar llamada **PWAsForFirefox**, la cual puede descargarse como paquete `.deb` para sistemas Linux. Se instala con el siguiente comando:

```bash
sudo dpkg -i ./firefoxpwa_2.14.1_amd64.deb
```

Una vez instalada, al recargar la página de la PWA aparecerá un ícono en la barra de navegación. Este ícono permite instalar la aplicación como una PWA en el sistema.

### Chrome y Edge (escritorio)

Chrome y Microsoft Edge ofrecen soporte nativo para la instalación de PWAs en escritorio. Para instalar:

Visitar la URL de la PWA publicada (por ejemplo, en GitHub Pages).

Esperar a que la aplicación se cargue completamente.

Aparecerá un ícono de instalación en la barra de direcciones o una notificación en la parte superior.

Alternativamente, abrir el menú del navegador y seleccionar la opción "Instalar aplicación" o "Instalar Temperature Converter".

La aplicación se instalará como una app independiente y podrá ejecutarse desde el sistema operativo como cualquier otro programa.

### Android (Chrome o Edge)

1. Acceder al enlace de GitHub Pages desde el navegador.
2. Esperar a que se cargue completamente.
3. Un mensaje como “Agregar a la pantalla principal” aparecerá automáticamente o se puede abrir el menú del navegador y seleccionar **Agregar a la pantalla principal**.
4. Confirmar para instalar la PWA.

### iPhone (Safari)

1. Abrir la URL de la PWA en Safari.
2. Pulsar el botón de **compartir** (icono de cuadrado con flecha hacia arriba).
3. Seleccionar **Añadir a la pantalla de inicio**.
4. Personalizar el nombre si se desea, luego pulsar **Añadir**.
