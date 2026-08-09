import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { describePorts, type RawPort, readSysfsIds } from './ports.js';

const ch340: RawPort = {
  path: '/dev/ttyUSB0',
  manufacturer: 'QinHeng Electronics',
  vendorId: '1A86',
  productId: '7523',
  serialNumber: undefined,
};

const bluetooth: RawPort = { path: '/dev/cu.Bluetooth-Incoming-Port' };
const legacy: RawPort = { path: '/dev/ttyS0' };
const someDongle: RawPort = { path: '/dev/ttyACM1', vendorId: '0bda', productId: '8153' };

describe('describePorts', () => {
  it('prefers the stable by-id path for connecting', () => {
    // /dev/ttyUSB0 is assigned in plug order; the by-id symlink is not. What
    // gets stored and reconnected to has to be the stable one.
    const byId = new Map([['/dev/ttyUSB0', '/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0']]);
    const [port] = describePorts([ch340], byId);

    expect(port.path).toBe('/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0');
    expect(port.device).toBe('/dev/ttyUSB0');
    expect(port.label).toContain('1a86 USB Serial');
  });

  it('falls back to the device node when there is no by-id link', () => {
    const [port] = describePorts([ch340], new Map());
    expect(port.path).toBe('/dev/ttyUSB0');
  });

  it('flags known plotter chips and sorts them first', () => {
    const ports = describePorts([someDongle, ch340], new Map());
    expect(ports.map((p) => p.device)).toEqual(['/dev/ttyUSB0', '/dev/ttyACM1']);
    expect(ports[0].known).toBe(true);
    expect(ports[1].known).toBe(false);
  });

  it('drops the noise the picker used to have to filter by hand', () => {
    const ports = describePorts([bluetooth, legacy, ch340], new Map());
    expect(ports.map((p) => p.device)).toEqual(['/dev/ttyUSB0']);
  });

  it('normalises vendor ids so case never decides the match', () => {
    const [port] = describePorts([{ ...ch340, vendorId: '0x1a86' }], new Map());
    expect(port.vendorId).toBe('1a86');
    expect(port.known).toBe(true);
  });
});

/**
 * A container gets /sys but not /run/udev, so `udevadm info -e` hands back
 * paths with no descriptors at all. Lay out the same shape sysfs has — tty ->
 * USB interface -> USB device — and check the ids are recovered from it.
 */
const fakeSysfs = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'ports-'));
  const usbDevice = path.join(root, 'devices/usb1/1-1');
  const usbInterface = path.join(usbDevice, '1-1:1.0/ttyUSB0');
  const sysClassTty = path.join(root, 'class/tty');

  await mkdir(usbInterface, { recursive: true });
  await mkdir(sysClassTty, { recursive: true });
  await writeFile(path.join(usbDevice, 'idVendor'), '1a86\n');
  await writeFile(path.join(usbDevice, 'idProduct'), '7523\n');
  await writeFile(path.join(usbDevice, 'manufacturer'), 'QinHeng Electronics\n');
  await mkdir(path.join(sysClassTty, 'ttyUSB0'));
  await symlink(usbInterface, path.join(sysClassTty, 'ttyUSB0/device'));

  return sysClassTty;
};

describe('readSysfsIds', () => {
  it('recovers the descriptors udev would have supplied', async () => {
    const sysClassTty = await fakeSysfs();
    const ids = await readSysfsIds('/dev/ttyUSB0', sysClassTty);

    expect(ids).toEqual({
      vendorId: '1a86',
      productId: '7523',
      manufacturer: 'QinHeng Electronics',
    });
    // The point of the whole exercise: this is what the picker ranks on.
    expect(describePorts([{ path: '/dev/ttyUSB0', ...ids }], new Map())[0].known).toBe(true);
  });

  it('says nothing rather than throwing when there is no sysfs', async () => {
    expect(await readSysfsIds('/dev/ttyUSB0', '/nope/class/tty')).toEqual({});
  });

  it('says nothing for a tty with no USB device above it', async () => {
    const sysClassTty = await fakeSysfs();
    const bare = path.join(sysClassTty, 'ttyAMA10');
    await mkdir(path.join(bare, 'device'), { recursive: true });

    expect(await readSysfsIds('/dev/ttyAMA10', sysClassTty)).toEqual({});
  });
});
