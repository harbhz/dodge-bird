# Dodge Bird

Dodge Bird is a touch-friendly arcade flight game built with Kaboom.js. Guide the bird through moving pipe gaps, collect energy, build close-call streaks, and survive increasingly difficult waves.

## Features

- Keyboard, mouse, and touch controls
- Responsive physics tuned for phones, tablets, and desktop browsers
- Progressive wave difficulty with faster pipes and tighter gaps
- Energy collectibles and three-item salvage missions
- Temporary shield that absorbs one pipe collision
- Near-miss streak bonuses
- Pause menu with Resume and Home actions
- Persistent best score, run count, and sound preference using browser storage
- Static deployment support for Netlify

## Run Locally

```bash
npm install
npm start
```

Open [http://localhost:8000](http://localhost:8000).

To build the static game bundle:

```bash
npm run build
```

## Controls

| Action | Keyboard | Pointer / Touch |
| --- | --- | --- |
| Flap | `Space` | Click or tap the play area |
| Pause / resume | `P` | Use the Pause button |
| Toggle sound | `M` | Use the Sound button |
| Restart after a run | `Space` | Tap or click |
| Return home | `R` | Use Home or swipe on the result screen |

## Project Structure

- `code/main.js` contains the Kaboom game scenes and gameplay systems.
- `index.html` is the static browser shell used by Netlify.
- `run.js` provides the local development server and build process.
- `sprites/` and `sounds/` contain the game assets.
- `netlify.toml` configures the Netlify publish directory and build command.

## Deployment

This project is intended to deploy on Netlify. Netlify runs `npm run build` and publishes the repository root, including the generated `dist/game.js` bundle.

GitHub Pages deployment is intentionally disabled. The former GitHub Actions Pages workflow has been removed so pushes to `main` do not create GitHub Pages deployments.

If GitHub Pages is still enabled in the repository settings, disable it at **Settings → Pages → Build and deployment** by selecting **GitHub Actions** only if no workflow is configured, or set the source to **Deploy from a branch** and remove the configured branch. You can also remove the Pages environment under **Settings → Environments** if it is no longer needed.

## License

This repository does not currently include a license file.