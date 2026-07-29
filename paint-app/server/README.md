# plotter-server

The serial backend for `paint-app`. It owns the USB link to the plotter so the
UI can be served from a Raspberry Pi that is physically wired to the machine,
instead of only from a laptop with the cable plugged into it.

It also serves the built renderer, so the whole thing is one container on one
port: `CLIENT_DIR` points at a `vite build` output and the SPA is handed out
from the same origin as the API. See `../Dockerfile`.

## Why a backend at all

Web Serial needs the browser to be on the machine holding the cable. That means
one laptop, tethered, for the duration of a print. Moving the port to a Pi means
the plotter is a network appliance: start a page from anywhere, walk away, and
swap pens from a phone.

Almost all of the value is in `src/plotter.ts`, which is a port of
`paint-app/src/serial.ts` (now deleted) — a pile of Marlin-specific behaviour that was
expensive to discover and would have to be rediscovered from scratch in another
language:

- Marlin resets when the port opens, so nothing it says for the first 2000ms
  counts.
- `M115` is a liveness probe. A board that has been `M112`'d answers nothing at
  all, and without the probe a connect marches on into `G28` and reports success
  against a dead board twenty seconds later.
- `echo:busy: processing` is a keepalive, not a reply. Waits use an
  **inactivity** timeout, never a deadline — `G28` takes as long as it takes.
- A port that reports itself already open gets closed and reopened after 300ms,
  because the OS does not release the device synchronously.
- A failed open gets exactly one delayed retry; the second failure is a real
  problem and says so.
- The port closing without anyone asking is device loss, and is distinct from a
  disconnect.
- Pausing blocks before writing the *next* line. The line in flight finishes and
  Marlin holds position.

## Design

**Jobs are uploaded whole; the send loop runs on the Pi.** Marlin's flow control
is lockstep — write a line, wait for `ok` — which is correct over USB and
disastrous over a network, where a page of art would cost thousands of round
trips. The client `POST`s the entire program once and then watches progress.

**The pen swap is server state.** It used to be a `Promise` parked inside a
React component, which meant closing the tab orphaned a half-drawn page. The job
now moves `running -> awaiting_pen_swap -> running`, and any client can post the
continue.

**Emergency stop has its own path.** `M112` is written straight to the port: no
control check, no write queue, no pause gate, and reachable over both WebSocket
and plain HTTP. Every other command waits its turn behind the one in flight, and
on a real board that wait is unbounded. See *Emergency stop* below.

**Exactly one controller.** Electron got single-ownership by refusing to launch
twice; a network service can be reached by several browsers at once. One client
holds control and may move the machine, the rest are read-only, and handover is
explicit. The exception is e-stop, which anyone may fire.

**Ports are enumerated server-side.** No picker, no user gesture, no CH340
driver quirks — and `/dev/serial/by-id/*` gives a name that survives a replug,
which `/dev/ttyUSB0` does not.

## Run it

```sh
npm install
npm run dev        # tsx watch, http://localhost:8080
npm run build      # tsc -> dist/
npm start          # node dist/index.js
npm test           # vitest, against a simulated Marlin board
npm run typecheck
npm run check      # biome lint + format, with writes
```

| Env | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8080` | |
| `HOST` | `0.0.0.0` | |
| `CLIENT_DIR` | — | Serve a built renderer from here, so the Pi hands out UI and API on one origin. |
| `CORS_ORIGIN` | `*` | |
| `MAX_JOBS` | `20` | Uploaded jobs retained, oldest evicted. |
| `MAX_UPLOAD` | `64mb` | |

### On the Pi

```sh
docker compose up -d
```

See `docker-compose.example.yml`. Two things are easy to get wrong:

- `devices:` grants the device node; it does **not** grant permission to open
  it. The tty is owned by `root:dialout`, so the container's user needs that
  group via `group_add:`. Check the host's GID with `getent group dialout`.
  Getting it wrong surfaces as `EACCES` at connect time, not at startup.
- Bind-mount `/dev/serial/by-id` read-only as well, or the server can only offer
  `/dev/ttyUSB0` — the name that moves.

`npm run release -- 0.2.0` tags `plotter-server-v0.2.0`; the workflow builds
`linux/arm64` and publishes to GHCR.

## Protocol

WebSocket for the session, REST for the boring parts. Not REST-only: the `tx`
and `rx` log is thousands of lines per print and polling for it is absurd, and
jog and e-stop want a socket that is already open. Not WebSocket-only either:
uploading a job is a request with a response, and e-stop over plain HTTP is a
useful thing to have when the socket is the broken part.

Every type below is exported from `src/protocol.ts`, which is dependency-free
and imported directly by `paint-app/src/plotterClient.ts` — one definition, so
the two halves of an emergency stop cannot drift apart.

### REST

| Method | Path | |
| --- | --- | --- |
| `GET` | `/api/health` | `{ ok, version, uptime }` |
| `GET` | `/api/ports` | `{ ports: PortInfo[] }`, likely plotters first |
| `GET` | `/api/state` | `Snapshot` — connection, session, active job |
| `GET` | `/api/jobs` | `{ jobs: JobSummary[] }` |
| `POST` | `/api/jobs` | Upload; `201 { job: JobSummary }` |
| `GET` | `/api/jobs/:id` | Summary; `?lines=1` includes the G-code |
| `DELETE` | `/api/jobs/:id` | `409` if it is the running job |
| `POST` | `/api/estop` | Fire `M112`. No control required. |

A job upload is the output of the client's existing `buildLayerPrograms`,
`PROLOGUE` and `EPILOGUE` — G-code generation stays in the client, so there is
one implementation of it:

```json
{
  "name": "page 1",
  "plotterName": "Ender-3 V3 SE",
  "prologue": ["G21", "G90", "G0 Z5.000 F3000"],
  "layers": [
    { "name": "Ink", "color": "#000000", "lines": ["G0 X1 Y1", "G1 X2 Y2"] },
    { "name": "Red", "color": "#ff0000", "lines": ["G0 X3 Y3"] }
  ],
  "epilogue": ["G0 X0 Y0", "M84"]
}
```

One array entry must be one command — embedded newlines are rejected rather than
split, so a job that claims to be 400 lines is 400 lines and the progress count
means something.

### WebSocket `/ws`

Client to server. Any message may carry an `id`; if it does, the server replies
with a matching `ack`.

| Type | Needs control | |
| --- | --- | --- |
| `ping` | no | |
| `identify` | no | `{ name }`, for the client list |
| `log.subscribe` | no | `{ kinds }` — `tx`/`rx` are opt-in, default is `info`+`err` |
| `control.claim` | no | Fails if someone holds it |
| `control.release` | no | |
| `control.takeover` | no | Unconditional; the previous holder is told at once |
| `estop` | **no** | |
| `connect` | yes | `{ portPath }` from `/api/ports` |
| `disconnect` | yes | Refused while a job runs |
| `job.start` | yes | `{ jobId }` |
| `job.continue` | yes | Pen swapped, carry on |
| `job.pause` / `job.resume` | yes | Gates before the next line |
| `job.cancel` | yes | |
| `jog` | yes | `{ lines }`, allowlisted, refused mid-layer, acks with the reply lines |
| `stream` | yes | `{ lines }`, same allowlist, honours pause, for interactive strokes |
| `position` | yes | `M114`, parsed |

`jog` bypasses the pause gate because operator moves are the point of having
paused; `stream` does not, because an interactive stroke is exactly the output
pause exists to hold back.

Server to client:

| Type | |
| --- | --- |
| `hello` | `clientId`, `serverVersion`, a full `Snapshot`, and recent `info`/`err` lines |
| `log` | Batched `LogLine[]`, filtered to the kinds you subscribed to |
| `connection` | `ConnectionStatus` |
| `session` | `SessionStatus` — who is connected, who holds control |
| `job` | `JobStatus` or null |
| `lost` | The port dropped without anyone asking |
| `ack` | `{ id, ok, error?, data? }` |
| `pong` | |

This preserves the browser callback surface conceptually: `log(line, kind)`
becomes the `log` frame, `onPhase` and `onPauseChange` fold into `connection`,
and `onLost` becomes `lost`.

### Job lifecycle

```
queued -> running -> awaiting_pen_swap -> running -> done
             |               |
             +-> paused      +-> cancelled
             |
             +-> failed   (device lost, emergency stop, unresponsive board)
```

`paused` is derived, not stored: the pause lives on the connection so it gates
every source of G-code, and a job parked at a pen swap is not additionally
paused.

### Emergency stop

The one genuine safety property here, so it is worth being explicit about what
is guaranteed and what is not.

Guaranteed by this code: `M112` is written to the port without waiting on the
control lock, the write queue, the pause gate, or the `ok` of whatever is in
flight. It is reachable from any client, controller or not, over the socket or
over `POST /api/estop`. Everything waiting on a reply is failed immediately
rather than left to time out, and the running job is failed rather than drained.
`src/plotter.test.ts` asserts this by ordering and by wall clock, and
`src/client.test.ts` asserts the same of the browser client: it fires from a
read-only observer that cannot send a single G-code line by the ordinary route,
and it fires with the session socket shut. Both fail if the bypass is removed.

Not guaranteed by this code: that the stop reaches the board. It travels over
your network, through this process, over USB, and relies on Marlin's
`EMERGENCY_PARSER` being compiled in — which stock Ender-3 V3 SE firmware does
have, and which `M115` reports as `Cap:EMERGENCY_PARSER:1`. **This is not a
substitute for the power switch.** A software stop that depends on a Wi-Fi link
is a convenience; the thing that actually stops the machine is the one you can
reach with your hand.

## Layout

```
src/
  protocol.ts    # the wire contract, dependency-free, shared with the client
  plotter.ts     # PlotterConnection — the Marlin port from serial.ts
  transport.ts   # the byte pipe: serialport in prod, a fake in tests
  ports.ts       # /dev/serial/by-id enumeration and ranking
  jobs.ts        # job store, validation, and the send loop with the pen swap
  hub.ts         # the single owner: port, job, clients, control lock, log fan-out
  server.ts      # express routes + websocket wiring
  config.ts
  index.ts       # entry, graceful shutdown
  client.test.ts # the renderer's API client, end to end against this server
  test/
    fakeMarlin.ts  # a scripted board: ok, banners, echo:busy, unplug, M112
```

`client.test.ts` tests code that lives in `../src/plotterClient.ts`. It sits here
because this is where the fake board and the real HTTP server are, and a client
tested only against a mock of its own server proves nothing.
