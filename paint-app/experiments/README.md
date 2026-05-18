# experiments

Throwaway prototypes used to figure out how to talk to the plotter
(a Creality Ender-3 V3 SE) before building the real React app in `../`.

## Files

| file        | what it is                                                            |
| ----------- | --------------------------------------------------------------------- |
| `jog.py`    | Python REPL that opens the serial port and accepts jog commands (`up 10`, `home`, raw G-code, etc.). Uses `pyserial`. |
| `jog.html`  | Same idea in the browser via the Chrome Web Serial API. Single file, no build step — open it directly in Chrome. |
| `venv/`     | Python virtualenv with `pyserial` for `jog.py`. Recreate with `python3 -m venv venv && source venv/bin/activate && pip install pyserial` if it's stale. |

## macOS prerequisites

### CH340 driver

The printer's USB-to-serial chip is a CH340. macOS doesn't ship with a
driver. Install from WCH: <https://www.wch-ic.com/downloads/CH34XSER_MAC_ZIP.html>
After install, approve the driver extension in
**System Settings → General → Login Items & Extensions → Driver Extensions**.

### USB hub quirk

On this Mac, the printer only enumerates through a USB hub (Anker USB-C).
Plugging the cable directly into the Mac shows nothing on the USB bus.
Use the hub.

## jog.py

```sh
source venv/bin/activate
python jog.py            # autodetect port
python jog.py --list     # list available ports
python jog.py --port /dev/cu.wchusbserial2120
```

Commands inside the REPL:

| input               | effect                            |
| ------------------- | --------------------------------- |
| `up 10`             | Y +10 mm                          |
| `down 5`            | Y -5 mm                           |
| `left 2`            | X -2 mm                           |
| `right 2`           | X +2 mm                           |
| `z+ 1` / `z- 1`     | Z up / down                       |
| `home`              | `G28` home all axes               |
| `pos`               | `M114` print current position     |
| `feed 6000`         | set jog feed rate (mm/min)        |
| `raw G1 X10 F3000`  | send any G-code line directly     |
| `quit` / `q`        | exit                              |

## jog.html

Open in Chrome (or any Chromium browser). Click **Connect**, pick the
`wchusbserial` port, then use the arrow pad / Z buttons / raw G-code
input. Same protocol as `jog.py`.

Web Serial requires a secure context. `file://` qualifies in Chrome,
so double-clicking the file works.
