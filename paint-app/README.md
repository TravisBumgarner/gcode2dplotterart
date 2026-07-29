# paint-app

A paint app that draws on virtual pages with stacked, color-coded layers and
emits G-code to a pen plotter (a Creality Ender-3 V3 SE running stock Marlin in
this repo).

The plotter is a network appliance, not a USB peripheral: [`server/`](server/README.md)
runs on a Raspberry Pi wired to the machine, owns the serial port, and serves
this UI. Open it from a laptop, start a page, walk away, and swap pens from a
phone. One container, one port, no desktop app.

## Stack

- Vite + React + TypeScript
- Material UI (theme + dialogs + menus)
- Dexie (IndexedDB) for project persistence
- Zod for runtime schemas
- Framer Motion for layer drag-and-drop reordering
- Biome for lint + format
- A REST + WebSocket client (`src/plotterClient.ts`) against the plotter server
  — any modern browser, no Web Serial, no desktop shell

## Develop

```sh
npm install
npm run dev                             # http://localhost:5173
PLOTTER_SERVER=http://plotter.local:8080 npm run dev   # against the Pi
```

`vite dev` proxies `/api` and `/ws` to `http://localhost:8080` — run
`npm --prefix server run dev` alongside it, or point `PLOTTER_SERVER` at a real
Pi. In production none of this applies: the server serves the built page, so
the API is same-origin.

```sh
npm run build         # production build -> dist/
npm run check         # biome lint + format with --write
npm run lint          # biome check (no writes)
npm run docker:build  # the arm64 appliance image, renderer and server together
```

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
- **Beforeunload guard.** Closing the tab while changes are unsaved triggers
  the browser's "leave this page?" prompt.

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
- **Plotter output.** Home screen → pick the serial port the *server* can see
  → Connect, then Print. The active page is turned into one job — a prologue,
  a block of G-code per visible layer (clipped to the page rectangle and
  translated to machine origin), an epilogue — uploaded in one request, and run
  by the server. Between layers the job parks in `awaiting_pen_swap`; every
  connected device shows the prompt and any of them can continue it. Closing
  the tab does not orphan the print.
- **One controller.** Several browsers can watch the same plotter; exactly one
  may move it. The top bar always says which you are. Taking control is
  allowed mid-print, so the dialog says so before you do it.
- **Emergency stop.** Fixed bottom-right whenever the plotter is connected,
  from any device, whether or not you hold control. It does not travel over the
  command socket — see the emergency stop section of
  [`server/README.md`](server/README.md), including what it does *not*
  guarantee.

## Persistence is per-browser

Projects and plotters live in this browser's IndexedDB, not on the server. The
page comes from the Pi but your work does not: open the app on your phone and
you get an empty project list. Export/import JSON is the way to move a project
between devices. This is a deliberate hole, not an oversight — moving
persistence to the server is a separate decision.

## Network backend (`server/`)

[`server/`](server/README.md) owns the serial port, runs the send loop next to
the USB cable, holds the job state machine, and serves this UI. See its README
for the protocol, the emergency-stop guarantees, and the Pi deployment notes.

## Hardware notes

See [`experiments/README.md`](experiments/README.md) for the CH340 driver
install, the USB hub quirk on this Mac, and the original `jog.py` / `jog.html`
prototypes that predate this app.

## Layout

```
src/
  App.tsx                    # shell + connection wiring
  store.tsx                  # Context + useReducer app state
  types.ts                   # Zod schemas / TS types
  plotterClient.ts           # REST + WebSocket client for server/
  connection.tsx             # React context over it: status, session, job, log
  gcode.ts                   # stroke -> G-code generator
  svg-import.ts              # SVG -> sampled strokes
  clip.ts                    # Liang-Barsky polyline-vs-rect clipping
  components/
    Toolbar.tsx              # control lock, pause, emergency stop
    SerialPortRow.tsx        # the server-side port picker
    LayersPanel.tsx
    Canvas.tsx
    PrintModal.tsx           # uploads the job, renders the server's state
Dockerfile                   # one image: this build + server/, arm64
```

`plotterClient.ts` is exercised end to end in `server/src/client.test.ts`,
against the same scripted Marlin the server is tested with.
