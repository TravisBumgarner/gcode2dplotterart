import { readdir, readlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { PortInfo } from './protocol.js';

const requireCjs = createRequire(import.meta.url);

/**
 * USB vendor IDs of the chips that show up on Marlin/GRBL boards: Arduino,
 * FTDI, CH340, CP210x, STM32, Teensy, Atmel, RP2040, SparkFun, OpenMoko.
 * A port from one of these outranks anything else, which is what lets a single
 * plotter be offered without asking. Carried over from the Electron picker.
 */
export const PLOTTER_VENDOR_IDS = new Set([
  '2341',
  '2a03',
  '0403',
  '1a86',
  '10c4',
  '0483',
  '16c0',
  '03eb',
  '2e8a',
  '1b4f',
  '1d50',
]);

/** Shape of one entry from `SerialPort.list()`, minus the fields we ignore. */
export type RawPort = {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
  pnpId?: string;
};

const norm = (id: string | undefined) => id?.toLowerCase().replace(/^0x/, '').padStart(4, '0');

const isKnown = (p: RawPort) => {
  const v = norm(p.vendorId);
  return v !== undefined && PLOTTER_VENDOR_IDS.has(v);
};

/**
 * Device nodes that are never a plotter. `/dev/ttyS*` is the ISA-era serial
 * range Linux enumerates by the dozen; `cu.Bluetooth`/`tty.Bluetooth` is the
 * macOS noise the Electron picker also had to filter.
 */
const isNoise = (p: RawPort) =>
  /^\/dev\/ttyS\d+$/.test(p.path) || /bluetooth|debug-console/i.test(p.path);

/**
 * `/dev/ttyUSB0` is assigned in plug order — it moves when you replug the
 * plotter or reboot with a second USB serial device attached. The by-id
 * symlink is derived from the descriptor and does not, so it is what gets
 * stored and reconnected to.
 */
export const BY_ID_DIR = '/dev/serial/by-id';

export async function readByIdLinks(dir = BY_ID_DIR): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    // No /dev/serial/by-id: macOS, or a container without /dev/serial mounted.
    return map;
  }
  for (const entry of entries) {
    const link = path.join(dir, entry);
    try {
      map.set(path.resolve(dir, await readlink(link)), link);
    } catch {
      // Raced with a replug; the next enumeration will pick it up.
    }
  }
  return map;
}

const label = (p: RawPort, stablePath: string | undefined) => {
  const pretty = stablePath
    ? path
        .basename(stablePath)
        .replace(/^usb-/, '')
        .replace(/-if\d+.*$/, '')
        .replace(/_/g, ' ')
    : p.manufacturer;
  return pretty ? `${pretty} (${p.path})` : p.path;
};

/**
 * Turn a raw `SerialPort.list()` into something a picker can render: noise
 * dropped, stable paths substituted, likely plotters first.
 *
 * Split out from `listPorts` so it can be exercised without a real `/dev`.
 */
export function describePorts(raw: RawPort[], byId: Map<string, string>): PortInfo[] {
  return raw
    .filter((p) => !isNoise(p))
    .map((p) => {
      const stable = byId.get(p.path);
      return {
        path: stable ?? p.path,
        device: p.path,
        label: label(p, stable),
        manufacturer: p.manufacturer,
        vendorId: norm(p.vendorId),
        productId: norm(p.productId),
        serialNumber: p.serialNumber,
        known: isKnown(p),
      };
    })
    .sort((a, b) => {
      // Known plotter chips first, then anything else with a USB vendor id,
      // then the leftovers — the same best-first order the Electron picker used.
      if (a.known !== b.known) return a.known ? -1 : 1;
      const aUsb = Boolean(a.vendorId);
      const bUsb = Boolean(b.vendorId);
      if (aUsb !== bUsb) return aUsb ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
}

export async function listPorts(): Promise<PortInfo[]> {
  // biome-ignore lint/suspicious/noExplicitAny: CJS interop for a native module
  const { SerialPort } = requireCjs('serialport') as any;
  const [raw, byId] = await Promise.all([SerialPort.list() as Promise<RawPort[]>, readByIdLinks()]);
  return describePorts(raw, byId);
}
