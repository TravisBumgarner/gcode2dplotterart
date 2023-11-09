from enum import Enum

class HandleOutOfBoundsEnum(Enum):
  Warning = "Warning"
  Error = "Error"
  Silent = "Silent"

class SpecialInstructionEnum(Enum):
  """
  Enum representing special instructions that can be included in G-code programs.
  
  Attributes:
  -----------
    pen_up : str
      Command to lift the pen off the drawing surface.
    pen_down : str
      Command to lower the pen onto the drawing surface.
    pause : str
      Command to pause the program execution.
    program_end : str
      Command to indicate the end of the program.
    units_mm : str
      Command to set the units of measurement to millimeters.
    units_inches : str
      Command to set the units of measurement to inches.
  """
  pen_up = "pen_up"
  pen_down = "pen_down"
  pause = "pause"
  program_end = "program_end"
  units_mm = "units_mm"
  units_inches = "units_inches"

class UnitsEnum(Enum):
  mm = "mm"
  inches = "inches"

class PlotterTypeEnum(Enum):
  """
  Enum representing the types of plotters available in the system.

  Attributes:
  -----------
    plotter_2d : str
      2D plotter.
    plotter_3d : str
      3D plotter.
  """
  plotter_2d = "plotter_2d"
  plotter_3d = "plotter_3d"