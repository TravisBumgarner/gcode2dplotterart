# paint-app

A paint app that draws on virtual pages with stacked, color-coded layers and
emits G-code to a USB-connected pen plotter (a Creality Ender-3 V3 SE running
stock Marlin in this repo). It ships two ways from one codebase: an Electron
desktop app and a static site for Chrome / Edge.

## Stack

- Electron (desktop shell) + Vite + React + TypeScript
- Material UI (theme + dialogs + menus)
- Dexie (IndexedDB) for project persistence
- Zod for runtime schemas
- Framer Motion for layer drag-and-drop reordering
- Biome for lint + format
- [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) for plotter I/O — built into the desktop app; Chrome / Edge only in the browser
- electron-builder for desktop packaging

## Develop

```sh
npm install
npm run dev:electron   # desktop app (Vite dev server + Electron, HMR)
npm run dev            # browser only, http://localhost:5173
```

`dev:electron` starts Vite and launches Electron against it in one process, so
quitting the app also stops the server. Web Serial requires a secure context;
`localhost` qualifies, as does the desktop app's custom scheme (below).

```sh
npm run build           # renderer only (static site)
npm run build:electron  # renderer + main process
npm run package         # installers into release/ (dmg + zip, nsis, AppImage)
npm run package:dir     # unpacked app into release/, skips installer creation
npm run check           # biome lint + format with --write
npm run lint            # biome check (no writes)
```

Packaging builds for the host platform only; pass `electron-builder`'s
`--mac` / `--win` / `--linux` flags to target others. macOS builds are signed
with whatever local identity is available and are **not** notarized.

## Desktop shell

`electron/main.ts` is the whole shell — there is no preload and no IPC, because
the renderer is the same code the browser build runs.

- **Custom scheme, not `file://`.** The packaged app serves `dist/` over
  `paint-app://app/`, registered as a standard + secure scheme. `file://` pages
  are an opaque origin, which makes `localStorage` and IndexedDB (where every
  project and plotter lives) unreliable and leaves Web Serial without its
  required secure context. The scheme also keeps the storage origin stable
  across app updates.
- **Serial port picker.** Chromium's port chooser doesn't exist in Electron, so
  main handles `select-serial-port`: ports reporting a USB `vendorId` are
  preferred (this drops noise like macOS's Bluetooth-Incoming-Port), a lone
  match is auto-selected, and anything more opens a native picker.
- **Unsaved-changes prompt.** Electron cancels `beforeunload` silently instead
  of showing Chromium's leave-site dialog, so main answers `will-prevent-unload`
  with a real confirm dialog.
- **Single instance.** A second launch focuses the existing window rather than
  fighting it over the serial port and the IndexedDB lock.

## Plotters

Plotters are first-class entities, separate from projects. Each plotter has a
name, bed size, feed rates, and pen Z heights. Plotters are **immutable once
created** — to change a parameter you must create a new plotter and switch the
project over to it. This keeps documents reproducible: a project that
references plotter `X` will always print exactly the way it did when you saved
it.

- A project picks its plotter at creation time and is bound to it for life.
  This mirrors the immutability of plotters themselves — the (project, plotter)
  pair is a fixed contract once you click Create.
- Plotters are managed from the Settings menu (top-left ⚙ → "Plotters…") or
  via the "Manage…" button in the home-screen New project form.
- Deleting a plotter is blocked while any project references it.
- Two ways to define a new plotter:
  - **Manual** — type each field (bed size, feeds, pen Z heights).
  - **Calibrate** — connect the plotter and walk through six steps (left,
    right, top, bottom, pen-down, pen-up). Each step jogs the head with
    on-screen arrow buttons and captures the live `M114` position.
    Bed dimensions are derived from the captured X/Y extremes.
- Exported JSON bundles a snapshot of the plotter so the document is portable
  across browsers / machines.

## Interactive mode

Selecting **Interactive session** from the home screen opens the same UI as a
normal document, with two differences:

- There can only be **one** interactive session, and it is **ephemeral** —
  closing or reopening "Interactive session" gives you a fresh canvas.
  Nothing is written to IndexedDB; autosave and the beforeunload guard skip
  interactive projects entirely.
- Every stroke you draw is **streamed to the plotter the moment you finish
  it**. The first stroke after a fresh connection sends the prologue
  (`G21 / G90 / G28`), and subsequent strokes are queued sequentially over
  the serial bus.

A red "Interactive · live" chip appears in the AppBar while a session is
active and connected. If the plotter is disconnected, the chip turns gray
("offline") and strokes you draw are NOT replayed when you reconnect — only
strokes drawn while connected get plotted.

## Saving and loading

- **Project gate.** On load, a modal asks you to create a new project or open
  an existing one. Projects live in IndexedDB (no backend).
- **Autosave.** Toggleable in the **Settings** menu (top-left ⚙). When on,
  changes are persisted ~800ms after the last edit.
- **Save now / status.** The cog tooltip and the AppBar caption show whether
  the current project is `saved`, `saving…`, `saving soon`, or `unsaved`.
- **Export / import JSON.** `Settings → Export JSON` downloads
  `<project>.json`. `Import JSON` validates with Zod and creates a new project.
- **Beforeunload guard.** Closing while changes are unsaved prompts first — the
  browser's "leave this page?" dialog on the web, a native confirm in the
  desktop app.

## Features

- **Infinite world canvas.** Strokes live in a single shared world-space
  coordinate system, in mm. Pages are just rectangles laid into that world.
  Drawing across page boundaries is fine — at print time, each page clips its
  share of every stroke and translates it into machine coordinates.
- **Pages.** New pages are added flush against the right edge of the rightmost
  page (no gap). Click `+` to the right of the rightmost page in the canvas to
  add another. Click a page to make it active. The active page is highlighted
  in blue and is what `Print` sends.
- **Pan / zoom.** Trackpad / scrollbars pan; **Cmd**/**Ctrl** + wheel zooms
  centered on the cursor. Bottom-right control resets to 100%.
- **Layers.** Stacked, color-coded, drag-to-reorder (top of the list = top of
  the stack). Each layer has a color, thickness in mm, and a visibility toggle.
  Drawing always goes into the active layer.
- **SVG import.** Toolbar → Import SVG. Paths/polylines/shapes are sampled and
  inserted as strokes into the active layer, scale-fit to the active page (in
  world coordinates offset by the page's position).
- **Freehand drawing.** Click and drag anywhere on a page to paint with the
  active layer. Drawing is confined to the union of pages — dragging into the
  gray void commits the current sub-stroke; dragging back onto a page begins
  a new one without lifting the pointer.
- **Shape tools.** A vertical palette between the layers panel and canvas
  offers pen, line, rectangle, ellipse, regular polygon (3–32 sides), and
  star (3–32 points). Polygon/star spawn a small `sides` / `pts` input under
  the palette when active; they're built as polylines so they emit clean
  G-code paths just like freehand strokes.
- **Plotter output.** Toolbar → Connect, pick the `wchusbserial*` port, then
  Print. The active page is sent: each visible layer becomes a block of G-code
  (clipped to the page rectangle and translated to machine origin), with a
  pause + audio chime + on-screen prompt between layers so you can swap pens.

## Hardware notes

See [`experiments/README.md`](experiments/README.md) for the CH340 driver
install, the USB hub quirk on this Mac, and the original `jog.py` / `jog.html`
prototypes that predate this app.

## Layout

```
electron/
  main.ts                    # Electron main process (protocol, serial, dialogs)
scripts/
  dev-electron.mjs           # Vite dev server + Electron, one process
src/
  App.tsx                    # shell + connection wiring
  store.tsx                  # Context + useReducer app state
  types.ts                   # Zod schemas / TS types
  serial.ts                  # Web Serial wrapper (PlotterConnection)
  gcode.ts                   # stroke -> G-code generator
  svg-import.ts              # SVG -> sampled strokes
  clip.ts                    # Liang-Barsky polyline-vs-rect clipping
  components/
    Toolbar.tsx
    LayersPanel.tsx
    Canvas.tsx
    PrintModal.tsx
```
