from enum import Enum


class HandleOutOfBoundsEnum(Enum):
    Warning = "Warning"
    Error = "Error"
    Silent = "Silent"


class SpecialInstructionEnum(Enum):
    """
    Enum representing special instructions that can be included in G-code
    programs.

    Attributes:
      navigation_mode : str
        Command to separate the drawing instrument from the drawing surface.
        Useful to call before moving the print head when you don't want to
        draw.
      drawing_mode : str
        Command to connect the drawing instrument to the drawing surface.
        Useful to call before beginning to draw.
      pause : str
        Command to pause the program execution.
      program_end : str
        Command to indicate the end of the program.
      units_mm : str
        Command to set the units of measurement to millimeters.
      units_inches : str
        Command to set the units of measurement to inches.
    """

    navigation_mode = "navigation_mode"
    drawing_mode = "drawing_mode"
    pause = "pause"
    program_end = "program_end"
    units_mm = "units_mm"
    units_inches = "units_inches"


class UnitsEnum(Enum):
    """
    Enum representing the types of units that are supported.

    Attributes:
      mm : str
        Millimeters
      inches : str
        Inches
    """

    mm = "mm"
    inches = "inches"


class PlotterTypeEnum(Enum):
    """
    Enum representing the types of plotters that are supported

    Attributes:
      plotter_2d : str
        2D Plotter
      plotter_3d : str
        3D Printer
    """

    plotter_2d = "plotter_2d"
    plotter_3d = "plotter_3d"


class PlottingInstructionTypeEnum(Enum):
    """
    An enumeration of the different types of plotting instructions.

    Attributes:
      setup : str
        Instructions run before plotting has begun.
      plotting : str
        Instructions run while plotting.
      teardown : str
        Instructions run once plotting has completed.
    """

    setup = "setup"
    plotting = "plotting"
    teardown = "teardown"
