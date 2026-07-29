import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useConnection } from '../connection';

/**
 * The replacement for `navigator.serial.requestPort()`.
 *
 * The browser's picker only ever offered ports on the machine running the
 * browser, which is the whole reason the plotter had to be tethered to a
 * laptop. The list here comes from the server over HTTP, so the plotter can be
 * on a Pi in another room and the page can be open on a phone.
 */
export const SerialPortRow = () => {
  const {
    serverReachable,
    connected,
    connecting,
    connectPhase,
    connect,
    disconnect,
    ports,
    portsLoading,
    portsError,
    refreshPorts,
    selectedPortPath,
    setSelectedPortPath,
    portPath,
    isController,
    controllerName,
    takeControl,
  } = useConnection();

  if (!serverReachable) {
    return (
      <Alert severity="error">
        Can't reach the plotter server. It serves this page, so if you're seeing this it either
        restarted or the connection dropped — this will recover on its own once it's back.
      </Alert>
    );
  }

  if (connected) {
    return (
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="success.main" sx={{ flex: 1 }}>
            Connected — homed and ready.
          </Typography>
          <Button size="small" color="error" onClick={disconnect} disabled={!isController}>
            Disconnect
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {portPath}
        </Typography>
        {!isController && <ReadOnlyNotice name={controllerName} onTake={takeControl} />}
      </Stack>
    );
  }

  const label = connectPhase === 'homing' ? 'Homing…' : connecting ? 'Connecting…' : 'Connect';

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ flex: 1 }} disabled={ports.length === 0}>
          <InputLabel>Serial port</InputLabel>
          <Select
            label="Serial port"
            value={ports.some((p) => p.path === selectedPortPath) ? (selectedPortPath ?? '') : ''}
            onChange={(e) => setSelectedPortPath(e.target.value)}
            renderValue={(value) => {
              const port = ports.find((p) => p.path === value);
              return port ? port.label : String(value);
            }}
          >
            {ports.map((p) => (
              <MenuItem key={p.path} value={p.path}>
                <Box>
                  <Typography variant="body2">{p.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.known ? 'Looks like a plotter' : 'Unrecognised device'} · {p.device}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Rescan the server's serial ports">
          <span>
            <IconButton size="small" onClick={refreshPorts} disabled={portsLoading}>
              {portsLoading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Button
          size="small"
          variant="contained"
          onClick={() => connect()}
          disabled={connecting || ports.length === 0 || !isController}
          startIcon={connecting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {label}
        </Button>
      </Stack>

      {portsError && <Alert severity="error">{portsError}</Alert>}
      {!portsLoading && !portsError && ports.length === 0 && (
        <Alert severity="warning">
          The server sees no serial ports. Check that the plotter is plugged into it and powered on,
          then rescan.
        </Alert>
      )}
      {!isController && <ReadOnlyNotice name={controllerName} onTake={takeControl} />}
    </Stack>
  );
};

const ReadOnlyNotice = ({ name, onTake }: { name: string | null; onTake: () => void }) => (
  <Alert
    severity="info"
    action={
      <Button size="small" onClick={onTake}>
        Take control
      </Button>
    }
  >
    {name ? `${name} has control` : 'Another client has control'} — you're watching. Taking control
    works even mid-print.
  </Alert>
);
