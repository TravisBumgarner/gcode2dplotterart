"""Interactive jog control for a Creality printer over USB serial.

Type commands like:
    up 10        move Y +10 mm
    down 5       move Y -5 mm
    left 2       move X -2 mm
    right 2      move X +2 mm
    z+ 1         move Z +1 mm
    z- 1         move Z -1 mm
    home         G28 home all axes
    pos          query current position (M114)
    raw G1 X10   send any G-code line directly
    feed 3000    set feed rate (mm/min) used for jogs
    quit / q     exit
"""

import sys
import time
import glob
import argparse
from typing import Optional

import serial
from serial.tools import list_ports


DEFAULT_BAUD = 115200
JOG_FEED_DEFAULT = 3000  # mm/min


def find_port() -> Optional[str]:
    """Pick the most likely printer serial port on macOS/Linux."""
    candidates = []
    for p in list_ports.comports():
        dev = p.device
        # macOS uses /dev/cu.usbserial-*, /dev/cu.usbmodem*, /dev/cu.wchusbserial*
        if any(s in dev for s in ("usbserial", "usbmodem", "wchusbserial", "SLAB_USBtoUART")):
            candidates.append(dev)
    if candidates:
        return candidates[0]
    # Fallback glob for macOS
    for pattern in ("/dev/cu.usbserial*", "/dev/cu.wchusbserial*", "/dev/cu.usbmodem*"):
        hits = glob.glob(pattern)
        if hits:
            return hits[0]
    return None


def list_all_ports() -> None:
    print("Available serial ports:")
    for p in list_ports.comports():
        print(f"  {p.device}  ({p.description})")


def read_until_ok(ser: serial.Serial, timeout: float = 5.0) -> str:
    """Read lines from serial until we see 'ok' or timeout. Returns combined text."""
    end = time.time() + timeout
    out = []
    while time.time() < end:
        line = ser.readline().decode(errors="replace").strip()
        if not line:
            continue
        out.append(line)
        if line.lower().startswith("ok"):
            break
    return "\n".join(out)


def send(ser: serial.Serial, gcode: str, *, echo: bool = True) -> str:
    line = gcode.strip()
    if not line:
        return ""
    ser.write((line + "\n").encode())
    ser.flush()
    resp = read_until_ok(ser)
    if echo:
        print(f">>> {line}")
        if resp:
            print(resp)
    return resp


def jog(ser: serial.Serial, axis: str, delta: float, feed: int) -> None:
    # Use relative positioning so we always step from current location.
    send(ser, "G91", echo=False)
    send(ser, f"G1 {axis}{delta:.3f} F{feed}")
    send(ser, "G90", echo=False)  # restore absolute mode


HELP = __doc__


def repl(ser: serial.Serial) -> None:
    feed = JOG_FEED_DEFAULT
    print(HELP)
    print(f"(jog feed = {feed} mm/min)\n")

    while True:
        try:
            raw = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not raw:
            continue

        parts = raw.split()
        cmd = parts[0].lower()
        arg = parts[1] if len(parts) > 1 else None

        try:
            if cmd in ("quit", "q", "exit"):
                return
            if cmd in ("help", "h", "?"):
                print(HELP)
                continue
            if cmd == "home":
                send(ser, "G28")
                continue
            if cmd == "pos":
                send(ser, "M114")
                continue
            if cmd == "feed":
                feed = int(arg)
                print(f"jog feed set to {feed} mm/min")
                continue
            if cmd == "raw":
                send(ser, raw[len("raw"):].strip())
                continue

            if cmd in ("up", "down", "left", "right", "z+", "z-",
                       "u", "d", "l", "r"):
                amount = float(arg) if arg is not None else 1.0
                axis_map = {
                    "up": ("Y", +1), "u": ("Y", +1),
                    "down": ("Y", -1), "d": ("Y", -1),
                    "right": ("X", +1), "r": ("X", +1),
                    "left": ("X", -1), "l": ("X", -1),
                    "z+": ("Z", +1),
                    "z-": ("Z", -1),
                }
                axis, sign = axis_map[cmd]
                jog(ser, axis, sign * amount, feed)
                continue

            print(f"unknown command: {cmd!r}  (type 'help')")
        except Exception as e:
            print(f"error: {e}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", help="serial port (autodetected if omitted)")
    ap.add_argument("--baud", type=int, default=DEFAULT_BAUD)
    ap.add_argument("--list", action="store_true", help="list serial ports and exit")
    args = ap.parse_args()

    if args.list:
        list_all_ports()
        return 0

    port = args.port or find_port()
    if not port:
        print("No printer serial port found.")
        list_all_ports()
        print("\nIf nothing matching usbserial/usbmodem appears:")
        print("  - confirm the printer is powered on and the USB cable is data-capable")
        print("  - install the CH340 driver (most Creality boards use CH340)")
        print("  - then re-run this script, or pass --port explicitly")
        return 1

    print(f"Connecting to {port} @ {args.baud}...")
    ser = serial.Serial(port, args.baud, timeout=1)
    # Many Marlin boards reset on serial open; wait for the boot banner.
    time.sleep(2.0)
    ser.reset_input_buffer()

    # Probe firmware so we know we're talking to it.
    send(ser, "M115")
    repl(ser)
    ser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
