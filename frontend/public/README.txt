Prism CRM brand assets

Files:
- prism-logo.png: full supplied artwork for the app's logo/brand image.
- favicon.ico and favicon.png: browser tab icons.
- apple-touch-icon.png: iOS home-screen icon.
- icon-192.png and icon-512.png: PWA/app icons.
- prism-icon-*.png: additional square sizes.

For a Vite/React app, copy these files into frontend/public/.
Then in frontend/index.html, inside <head>, add or update:
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

Use the logo in React with:
<img src="/prism-logo.png" alt="Prism CRM" />

The project source was not included with this image upload, so these are prepared assets;
the app's components and HTML have not been edited.
