# TUI Todo

A terminal-style todo application that runs in your browser. Built with vanilla HTML, CSS, and JavaScript — zero dependencies. Inspired by the aesthetics of [ratatui](https://github.com/ratatui/ratatui), it features a dark terminal theme with scanline effects, monospace fonts, and box-drawing borders.

## Features

- **Three-pane layout** — Categories, Tasks, and Task Details
- **Keyboard-driven navigation** — Vim-style keybindings (`j`/`k`) alongside arrow keys
- **Task priorities** — Low, Medium, and High with color-coded indicators
- **Local storage persistence** — Data survives browser refreshes with no backend required
- **Mobile support** — Virtual keyboard toggle for on-screen shortcut input
- **GitHub Pages deployment** — Automatic deployment on push to `main`

## Keyboard Shortcuts

Press `?` in the app to view the help dialog.

### Navigation

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Switch between panes |
| `1` `2` `3` | Jump to pane directly |
| `Up` / `k` | Move up in list |
| `Down` / `j` | Move down in list |
| `Enter` | Focus into tasks from categories |
| `q` | Go back / deselect |

### Categories (Pane 1)

| Key | Action |
|---|---|
| `a` | Add new category |
| `d` | Delete selected category |
| `r` | Rename selected category |

### Tasks (Pane 2)

| Key | Action |
|---|---|
| `a` | Add new task |
| `d` | Delete selected task |
| `Space` | Toggle task completion |
| `e` | Edit task |
| `p` | Cycle priority (Low → Medium → High) |

### Details (Pane 3)

| Key | Action |
|---|---|
| `e` | Edit task |
| `p` | Cycle priority |
| `Space` | Toggle task completion |

### Dialogs

| Key | Action |
|---|---|
| `Enter` | Confirm input |
| `Esc` | Cancel / close |
| `y` | Confirm delete |
| `n` | Cancel delete |

## Running Locally

No build step needed. Serve the files with any static HTTP server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Terminal-inspired theme using CSS custom properties, scanline CRT effect
- **JavaScript** — Vanilla JS, no frameworks or libraries
- **localStorage** — Client-side data persistence
- **GitHub Actions** — CI/CD for GitHub Pages deployment

Fonts: JetBrains Mono, Fira Code, Cascadia Code, SF Mono, Consolas (monospace stack).

## Project Structure

```
├── index.html          Main HTML entry point
├── app.js              Application logic (state, rendering, keyboard handling)
├── style.css           Terminal-inspired styling
├── LICENSE             MIT License
└── .github/
    └── workflows/
        └── deploy.yml  GitHub Pages deployment workflow
```

## License

[MIT](LICENSE)
