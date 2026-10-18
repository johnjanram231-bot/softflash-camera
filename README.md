# Softflash Camera ✳

A responsive, retro-inspired web camera for phones, tablets, and laptops. It runs as a static website and can be hosted for free on GitHub Pages.

## Features

- Uses your device's camera with browser permission
- Front/back camera switch on supported phones
- Seven live camera looks: Digicam, Golden Hour, 35mm Film, Portrait, Cool Blue, Black & White, and Faded Memory
- Captures photos with the selected look and lightweight grain/warmth effects
- Self timer: off, 3 seconds, or 10 seconds
- 4:3, 3:2, square, and widescreen framing
- Download captured photos as JPG
- Responsive layout for mobile and desktop

## Publish on GitHub Pages

1. Sign in to GitHub and create a **new public repository** named `softflash-camera` (or any name you prefer).
2. Upload `index.html`, `style.css`, `app.js`, and `README.md` to the repository's root folder.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**, then click **Save**.
6. Wait for GitHub to publish the site. The Pages URL will look like `https://YOUR-USERNAME.github.io/softflash-camera/`.

## Run locally

For camera permissions, use localhost rather than opening `index.html` as a `file://` URL.

If Python is installed, open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Important notes

- Camera access requires HTTPS (GitHub Pages provides HTTPS) or localhost. The browser will ask you to allow camera access.
- If the camera does not start, check browser permissions and close other apps that may be using the camera.
- The gallery is kept in memory for the current page session. Download photos you want to keep; refreshing or closing the page clears the in-app gallery.
- Camera features and switching to the rear camera depend on the device and browser.
- This is a filter-based camera app inspired by retro digital cameras and film looks. It is not affiliated with or endorsed by Kodak, Canon, or any camera manufacturer.
