from enum import Enum


class HandleOutOfBoundsEnum(Enum):
    Warning = "Warning"
    Error = "Error"
    Silent = "Silent"


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


class InstructionTypeEnum(Enum):
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
