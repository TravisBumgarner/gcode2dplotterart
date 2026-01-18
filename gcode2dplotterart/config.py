from dataclasses import dataclass

from .shared_types import HandleOutOfBounds


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
