import { createRequire } from 'node:module';

/**
 * The byte pipe under `PlotterConnection`.
 *
 * `PlotterConnection` is the part with all the Marlin knowledge in it, and it
 * is the part worth testing. Hiding `serialport` behind this interface lets the
 * tests drive a scripted firmware instead of a real board, and keeps the actual
 * native binding down to the ~40 lines below.
 */
export interface SerialTransport {
  /** True while the underlying device handle is held open. */
  readonly isOpen: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  write(data: string): Promise<void>;
  onData(cb: (chunk: string) => void): void;
  /** The handle went away — either we closed it or the device vanished. */
  onClose(cb: () => void): void;
  onError(cb: (err: Error) => void): void;
}

export type TransportFactory = (path: string, baudRate: number) => SerialTransport;

// `serialport` is a native module. Loading it lazily keeps `import`ing anything
// from this package (the protocol types, the tests) from touching the binding,
// which is the difference between a clear "no prebuild for this platform" at
// connect time and an unexplained crash at startup.
const requireCjs = createRequire(import.meta.url);

/** Real hardware. */
export const nodeTransport: TransportFactory = (path, baudRate) => {
  // biome-ignore lint/suspicious/noExplicitAny: CJS interop for a native module
  const { SerialPort } = requireCjs('serialport') as any;

  const port = new SerialPort({ path, baudRate, autoOpen: false });
  let closeCb: () => void = () => {};

  // `serialport` emits 'close' both for our own close() and for a yanked USB
  // cable (with `err.disconnected`). `PlotterConnection` already distinguishes
  // the two via its own intentional-close flag, so both funnel to one callback.
  port.on('close', () => closeCb());

  return {
    get isOpen() {
      return Boolean(port.isOpen);
    },
    open: () =>
      new Promise<void>((resolve, reject) => {
        port.open((err: Error | null) => (err ? reject(err) : resolve()));
      }),
    close: () =>
      new Promise<void>((resolve) => {
        if (!port.isOpen) return resolve();
        port.close(() => resolve());
      }),
    write: (data) =>
      new Promise<void>((resolve, reject) => {
        port.write(data, (err: Error | null | undefined) => {
          if (err) return reject(err);
          // Without the drain the next line can be handed to the kernel before
          // this one has left, which Marlin's line buffer does not appreciate.
          port.drain((derr: Error | null | undefined) => (derr ? reject(derr) : resolve()));
        });
      }),
    onData: (cb) => port.on('data', (chunk: Buffer) => cb(chunk.toString('utf8'))),
    onClose: (cb) => {
      closeCb = cb;
    },
    onError: (cb) => port.on('error', cb),
  };
};
