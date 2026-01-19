"""All instruction classes for G-Code generation.

Each instruction class is a dataclass that implements the Instruction protocol
by providing a to_g_code() method.
"""

from dataclasses import dataclass


@dataclass
class InstructionPoint:
    """A point in 2D space with a feed rate.

    Args:
        feed_rate: The feed rate for movement.
        x: The x-coordinate of the point.
        y: The y-coordinate of the point.

    Raises:
        ValueError: If x or y is None.
    """

    feed_rate: float
    x: float
    y: float

    def __post_init__(self) -> None:
        if self.x is None or self.y is None:
            raise ValueError("Point requires an X or Y")

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        output = "G1 "
        if self.x is not None:
            output += f"X{self.x:.3f} "
        if self.y is not None:
            output += f"Y{self.y:.3f} "
        output += f"F{self.feed_rate}"
        return output


@dataclass
class InstructionComment:
    """A comment in G-Code.

    Args:
        text: The text of the comment.
    """

    text: str

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return f"\n;{self.text}"


@dataclass
class InstructionFeedRate:
    """Set the feed rate.

    Args:
        feed_rate: The feed rate value.
    """

    feed_rate: float

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return f"F{self.feed_rate}"


@dataclass
class InstructionPause:
    """Perform a brief pause.

    Args:
        duration: The duration of the pause in seconds.
    """

    duration: float = 0.25

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return f"G4 P{self.duration}"


@dataclass
class Instruction3DPrinterPlottingHeight:
    """Connect plotting instrument to plotting surface (3D printer).

    Args:
        z_plotting_height: The height of the plotter head when plotting.
        feed_rate: The feed rate for the Z movement.
    """

    z_plotting_height: float
    feed_rate: float

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return f"G1 Z{self.z_plotting_height} F{self.feed_rate}"


@dataclass
class Instruction3DPrinterNavigationHeight:
    """Separate plotting instrument from plotting surface (3D printer).

    Args:
        z_navigating_height: The height of the plotter head when navigating.
        feed_rate: The feed rate for the Z movement.
    """

    z_navigating_height: float
    feed_rate: float

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return f"G1 Z{self.z_navigating_height} F{self.feed_rate}"


@dataclass
class Instruction2DPlotterPlottingHeight:
    """Connect plotting instrument to plotting surface (2D plotter)."""

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return "M3 S1000"


@dataclass
class Instruction2DPlotterNavigationHeight:
    """Separate plotting instrument from plotting surface (2D plotter)."""

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return "M3 S0"


@dataclass
class InstructionUnitsMM:
    """Set the units to millimeters."""

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return "G21"


@dataclass
class InstructionProgramEnd:
    """Instruct the plotting device that plotting has completed."""

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return "M2"


@dataclass
class InstructionHome:
    """Return the plotter to the home position."""

    def to_g_code(self) -> str:
        """Convert instruction to G-Code."""
        return "G28"
