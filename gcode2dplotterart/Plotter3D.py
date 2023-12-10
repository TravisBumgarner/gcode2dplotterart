from typing import Optional

from ._Plotter import _AbstractPlotter
from .layer import Layer3D
from .shared_types import THandleOutOfBounds


class Plotter3D(_AbstractPlotter):
    """
    `Plotter3D` is a 3D plotter for creating artwork using G-code. This class should be used with a 3D printer.

    `Plotter3D` extends from the abstract class `Plotter`.
    """

    z_plotting_height: float
    z_navigation_height: float

    def __init__(
        self,
        title: str,
        x_min: float,
        x_max: float,
        y_min: float,
        y_max: float,
        z_plotting_height: float,
        z_navigation_height: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds = "Warning",
        output_directory: str = "./output",
        include_comments: bool = True,
    ) -> None:
        """
        Initializes a new instance of the Plotter3D class.

        Args:
        - title (str) : The title of the work of art.
        - x_min (float) : The minimum X-coordinate of the plotter.
        - y_min (float) : The minimum Y-coordinate of the plotter.
        - x_max (float) : The maximum X-coordinate of the plotter.
        - y_max (float) : The maximum Y-coordinate of the plotter.
        - z_plotting_height (float) : The height of the
          [plotting instrument](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase) when plotting on the
          [plotting surface](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate).
        - z_navigation_height (float) : The height of the
          [plotting instrument](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase) when navigating
          to a new location.
        - feed_rate (float) : The [feed rate](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate), for the plotter.
        - handle_out_of_bounds (`Warning` | `Error`, optional):
          How to handle out-of-bounds points.
          `Warning` will print a warning, skip the point, and continue.
          `Error` will throw an error and stop.
          Defaults to `Warning`.
        - output_directory (str, optional) : The directory where G-code files will be saved. Defaults to `./output`.
        - include_comments (bool, optional) : Whether to include comments in the G-Code files. Useful for learning about G-Code and debugging. D
          efaults to `True`.
        """

        super().__init__(
            title=title,
            x_min=x_min,
            x_max=x_max,
            y_min=y_min,
            y_max=y_max,
            feed_rate=feed_rate,
            handle_out_of_bounds=handle_out_of_bounds,
            output_directory=output_directory,
            include_comments=include_comments,
        )
        self.z_plotting_height = z_plotting_height
        self.z_navigation_height = z_navigation_height

    def add_layer(
        self,
        title: str,
        color: Optional[str] = None,
        line_width: float = 2.0,
        preview_only: bool = False,
    ) -> Layer3D:
        """
        Adds a new layer to the plotter.

        Args:
        - title (str): The title of the layer.
        - color (Optional[str], optional): The color of the layer. Defaults to `None`.
        - line_width (float, optional): The line width of the layer. Defaults to `2.0`.
        - preview_only (bool, optional): Whether the layer is for preview only. Defaults to `False`.

        Returns:
        - Layer3D: The newly created [layer](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#layer).
        """

        new_layer = Layer3D(
            plotter_x_min=self.x_min,
            plotter_x_max=self.x_max,
            plotter_y_min=self.y_min,
            plotter_y_max=self.y_max,
            feed_rate=self.feed_rate,
            handle_out_of_bounds=self.handle_out_of_bounds,
            preview_only=preview_only,
            line_width=line_width,
            z_plotting_height=self.z_plotting_height,
            z_navigation_height=self.z_navigation_height,
            color=color,
            include_comments=self.include_comments,
        )

        self.layers[title] = new_layer

        return new_layer
