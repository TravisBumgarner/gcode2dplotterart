from abc import ABC, abstractmethod


class _BaseInstruction(ABC):
    """
    Abstract class representing an instruction in G-Code.
    """

    # @abstractmethod
    # def __str__(self) -> str:
    # pass

    @abstractmethod
    def to_g_code(self) -> str:
        pass


class InstructionPoint(_BaseInstruction):
    """
    A point in 2D space with an optional feed rate. The most basic building block for plotting a layer.

    Args:
      x (float) : The x-coordinate of the point.
      y (float) : The y-coordinate of the point.
      feed_rate (float, optional) : The feed rate of the point, defaults to the value defined by the `Plotter`.

    Raises:
      ValueError : If x or y is not provided.
    """

    def __init__(self, feed_rate: float, x: float, y: float):
        self.x = x
        self.y = y
        self.feed_rate = feed_rate

        if x is None or y is None:
            raise ValueError("Point requires an X or Y")

    def __str__(self) -> str:
        return f"Point: ({self.x}, {self.y})"

    def to_g_code(self) -> str:
        """
        Convert instruction to G-Code.

        Returns:
          str : A point in G-Code format.
        """
        output = "G1 "
        if self.x is not None:
            output += f"X{self.x:.3f} "
        if self.y is not None:
            output += f"Y{self.y:.3f} "
        output += f"F{self.feed_rate}"
        return output


class InstructionComment(_BaseInstruction):
    """
    A comment. Useful for adding notes to the G-Code file.

    Args:
      text (str) : The text of the comment.
    """

    def __init__(self, text: str):
        self.text = text

    def __str__(self) -> str:
        return f";{self.text}"

    def to_g_code(self) -> str:
        """
        Convert instruction to G-Code.

        Returns:
          string
            A comment in G-Code format.
        """
        return f"\n;{self.text}"


class InstructionFeedRate:
    """Set the feed feed rate.

    Args:
      feed_rate (float) : The feed rate.
    """

    def __init__(self, feed_rate: float):
        self.feed_rate = feed_rate

    def __str__(self) -> str:
        return f"Set feed rate to {self.feed_rate}"

    def to_g_code(self) -> str:
        """Convert instruction to G-Code.

        Returns:
          str : The feed rate in G-Code format.
        """
        return f"F{self.feed_rate}"


class InstructionPause(_BaseInstruction):
    """
    Perform a brief pause. Useful, to reduce and prevent vibration.

    Args:
      duration (float, optional) : The duration of the pause in seconds. Defaults to 0.25s.
    """

    def __init__(self, duration: float = 0.25) -> None:
        self.duration = duration

    def __str__(self) -> str:
        return "Perform a brief pause"

    def to_g_code(self) -> str:
        """Convert instruction to G-Code.

        Returns:
          str : The pause in G-Code format.
        """
        return f"G4 P{self.duration}"


class Instruction3DPrinterPlottingHeight:
    """
    Connect plotting instrument to plotting surface

    Args:
      z_plotting_height (float) : The height of the plotter head when plotting
    """

    def __init__(self, z_plotting_height: float):
        self.z_plotting_height = z_plotting_height

    def __str__(self) -> str:
        return "Connect plotting instrument to plotting surface"

    def to_g_code(self) -> str:
        """Convert instruction to G-Code.

        Returns:
          str : The plotting height in G-Code format.
        """
        return f"G1 Z{self.z_plotting_height}"


class Instruction3DPrinterNavigationHeight:
    """Separate plotting instrument from plotting surface.

    Args:
      z_navigating_height (float) : The height of the plotter head when navigating
    """

    def __init__(self, z_navigating_height: float):
        self.z_navigating_height = z_navigating_height

    def __str__(self) -> str:
        return "Separate plotting instrument from plotting surface"

    def to_g_code(self) -> str:
        """Convert instruction to G-Code.

        Returns:
          str : The navigating height in G-Code format.
        """
        return f"G1 Z{self.z_navigating_height}"
