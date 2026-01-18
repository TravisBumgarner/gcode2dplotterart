from dataclasses import dataclass
from typing import Optional

from .shared_types import HandleOutOfBounds


@dataclass
class LayerConfig:
    """
    Configuration for a layer instance.

    Groups the common parameters used by all layer types (2D and 3D).
    """

    plotter_x_min: float
    plotter_x_max: float
    plotter_y_min: float
    plotter_y_max: float
    feed_rate: float
    handle_out_of_bounds: HandleOutOfBounds
    line_width: float
    include_comments: bool
    color: Optional[str] = None
    preview_only: bool = False

    @property
    def plotter_width(self) -> float:
        """Width of the plotter area."""
        raise NotImplementedError("Stub - to be implemented")

    @property
    def plotter_height(self) -> float:
        """Height of the plotter area."""
        raise NotImplementedError("Stub - to be implemented")


@dataclass
class PlotterConfig:
    """
    Configuration for a plotter instance.

    Groups the common parameters used by all plotter types (2D and 3D).
    """

    title: str
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    feed_rate: float
    handle_out_of_bounds: HandleOutOfBounds = "Warning"
    output_directory: str = "./output"
    include_comments: bool = True
    return_home_before_plotting: bool = True

    @property
    def width(self) -> float:
        """Width of the plotting area."""
        return abs(self.x_max - self.x_min)

    @property
    def height(self) -> float:
        """Height of the plotting area."""
        return abs(self.y_max - self.y_min)
