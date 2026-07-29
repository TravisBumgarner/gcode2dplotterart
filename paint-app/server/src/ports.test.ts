import { describe, expect, it } from 'vitest';
import { describePorts, type RawPort } from './ports.js';

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
