# This code was offered by Copilot. It does a reasonable job of sending G-Code commands.
# I don't actually need it at this point, don't want to throw it away, so I'm keeping it here.

import cmd
import serial
import serial.tools.list_ports
import sys
import threading
from typing import Optional


class GCodeCLI(cmd.Cmd):
    intro = "Welcome to the G-Code CLI. Type help or ? to list commands.\n"
    prompt = "(gcode) "
    ser: Optional[serial.Serial] = None
    stop_thread = False

    def do_list_ports(self, arg: str) -> None:
        "List available serial ports."
        ports = serial.tools.list_ports.comports()
        if not ports:
            print("No serial ports found.")
            return
        for port in ports:
            print(f"{port.device}: {port.description}")

    def do_connect(self, arg: str) -> None:
        "Connect to a serial port. Usage: connect <port> [baudrate]"
        args = arg.split()
        if not args:
            print("Error: Port name is required. Usage: connect <port> [baudrate]")
            return
        port = args[0]
        baudrate = 115200  # Default baudrate
        if len(args) > 1:
            try:
                baudrate = int(args[1])
            except ValueError:
                print("Error: Baudrate must be an integer.")
                return
        try:
            self.ser = serial.Serial(port, baudrate, timeout=1)
            print(f"Connected to {port} at {baudrate} baud.")
            # Start thread to read incoming data
            self.stop_thread = False
            threading.Thread(target=self.read_from_port, daemon=True).start()
        except serial.SerialException as e:
            print(f"Error connecting to {port}: {e}")

    def do_disconnect(self, arg: str) -> None:
        "Disconnect from the current serial port."
        if self.ser and self.ser.is_open:
            self.stop_thread = True
            self.ser.close()
            print("Disconnected.")
        else:
            print("No active connection.")

    def do_send(self, arg: str) -> None:
        "Send a G-Code command. Usage: send <command>"
        if self.ser and self.ser.is_open:
            command = arg.strip()
            if not command:
                print("Error: G-Code command is required. Usage: send <command>")
                return
            try:
                self.ser.write((command + "\n").encode())
                print(f"Sent: {command}")
            except serial.SerialException as e:
                print(f"Error sending command: {e}")
        else:
            print("Error: Not connected to any serial port.")

    def do_exit(self, arg: str) -> bool:
        "Exit the CLI."
        print("Exiting...")
        if self.ser and self.ser.is_open:
            self.stop_thread = True
            self.ser.close()
        return True

    def do_EOF(self, arg: str) -> bool:
        "Exit the CLI using Ctrl+D."
        print()
        return self.do_exit(arg)

    def read_from_port(self) -> None:
        while not self.stop_thread:
            try:
                if self.ser and self.ser.in_waiting:
                    line = self.ser.readline().decode(errors="ignore").strip()
                    if line:
                        print(f"\nReceived: {line}\n(gcode) ", end="", flush=True)
                else:
                    print("No data to read.")
            except serial.SerialException:
                print("\nSerialException, probably fine.")
                break


if __name__ == "__main__":
    try:
        print("TL;DR 1. list_ports 2. connect <port> 3. send <command>")
        GCodeCLI().cmdloop()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
