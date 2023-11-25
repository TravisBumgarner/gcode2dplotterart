import os
import shutil
from typing import List, Dict, Union, Optional, Literal
from abc import ABC, abstractmethod
import matplotlib.pyplot as plt

from .Layer import Layer2D, Layer3D
from .shared_types import THandleOutOfBounds


class _AbstractPlotter(ABC):
    title: str
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    feed_rate: float
    layers: Dict[str, Union[Layer2D, Layer3D]]
    output_directory: str
    handle_out_of_bounds: THandleOutOfBounds

    def __init__(
        self,
        title: str,
        x_min: float,
        x_max: float,
        y_min: float,
        y_max: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds,
        output_directory: str,
    ):
        self.title = title
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.feed_rate = feed_rate
        self.layers = {}
        self.output_directory = output_directory
        self.handle_out_of_bounds = handle_out_of_bounds

    def get_min_and_max_points(
        self,
    ) -> Dict[Literal["x_min", "y_min", "x_max", "y_max"], float]:
        """
        Find the min and max plot points of the plotter.

        Returns:
        - dict : {x_min (float), y_min (float), x_max (float), y_max (float)}
            A dictionary containing the min and max plot points of the plotter.
        """
        all_layers_mins_and_maxes = [
            layer.get_min_and_max_points() for layer in self.layers.values()
        ]

        x_min_values = [t["x_min"] for t in all_layers_mins_and_maxes]
        x_max_values = [t["x_max"] for t in all_layers_mins_and_maxes]
        y_min_values = [t["y_min"] for t in all_layers_mins_and_maxes]
        y_max_values = [t["y_max"] for t in all_layers_mins_and_maxes]

        overall_x_min = min(x_min_values)
        overall_x_max = max(x_max_values)
        overall_y_min = min(y_min_values)
        overall_y_max = max(y_max_values)

        return {
            "x_min": overall_x_min,
            "y_min": overall_y_min,
            "x_max": overall_x_max,
            "y_max": overall_y_max,
        }

    @abstractmethod
    def add_layer(
        self,
        title: str,
        color: Optional[str] = None,
        line_width: float = 2.0,
        preview_only: bool = False,
    ) -> Union[Layer2D, Layer3D]:
        """
        Add a new layer to the plotter.

        Args:
        - title (str) : The title of the layer. Used when saving a layer to G-Code.
        - color (str) : A hex color (such as `#00FF00`) or human-readable color name
            (see [MatplotLib](https://matplotlib.org/stable/gallery/color/named_colors.html#css-colors)
            for a list of colors). Used with the `preview` method. Defaults to a random color if not provided.
        - line_width (Optional[float]) : The width of the line to be plotted. Used with the `preview` method. Defaults to 2.0.
        - preview_only (bool) : Whether the layer is a preview layer. Preview layers show the
            plotter head in motion but do not come in contact with plotting surface. Defaults to `False`.

        Returns:
        - Layer : The newly created layer. Allows for chaining of the layer's add methods.
        """

        pass

    def _add_preview_layer(self) -> None:
        """
        Creates a new layer titled preview. The preview layer outlines the
        plotting area and plots an X through the middle without plotting anything.
        Useful for checking the the plotting surface is flat.
        """
        points = self.get_min_and_max_points()

        self.add_layer("preview", preview_only=True)
        self.layers["preview"].add_rectangle(
            points["x_min"], points["y_min"], points["x_max"], points["y_max"]
        ).add_line(
            points["x_min"], points["y_min"], points["x_max"], points["y_max"]
        ).add_line(
            points["x_min"], points["y_max"], points["x_max"], points["y_min"]
        )

    @property
    def width(self) -> float:
        """
        Width of the plotting area


        Returns:
        - float : The width of the plotting area.
        """
        return abs(self.x_max - self.x_min)

    @property
    def height(self) -> float:
        """
        Height of the plotting area

        Returns:
        - float : The height of the plotting area.
        """
        return abs(self.y_max - self.y_min)

    def is_point_in_bounds(self, x: float, y: float) -> bool:
        """
        Whether the point to be plotted is within the plotter bounds.

        Args:
        - x (float) : The x-coordinate of the point to be plotted.
        - y (float) : The y-coordinate of the point to be plotted.

        Returns:
        - bool : Whether the point to be plotted is within the plotter bounds.
        """

        too_low = x < self.x_min or y < self.y_min
        too_high = x > self.x_max or y > self.y_max

        return not too_low and not too_high

    def get_plotting_data(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Get current plotting data.

        Returns:
        - dict: {"layer" : {"setup": [], "plotting": [], "teardown": []}}
            A dictionary of dictionaries containing the setup, plotting, and teardown instructions as an array of
            G-Code instruction strings per layer. Mostly used for testing purposes.
        """

        # Creates a new layer titled preview
        self._add_preview_layer()

        output = {}
        for title, layer in self.layers.items():
            output[title] = layer.get_plotting_data()
        return output

    def preview(self, show_entire_plotting_area: bool = True) -> None:
        """
        Generate a preview graph of the plotter's layers. Layers will be plotted in the order they've been added to the
        `Plotter`. Only looks at instructions during the plotting phase.

        Args:
        - show_entire_plotting_area (bool, optional): Whether to show the entire plotting area or just the
          size of the art to be plotted. Defaults to True.
        """

        _, ax = plt.subplots()

        for layer_title in self.layers:
            preview_paths = self.layers[layer_title].preview_paths()
            for preview_path in preview_paths:
                x_values, y_values = zip(*preview_path)
                ax.plot(
                    x_values,
                    y_values,
                    color=self.layers[layer_title].color,
                    linestyle="-",
                    linewidth=self.layers[layer_title].line_width,
                    solid_capstyle="round",
                )

        if show_entire_plotting_area:
            plt.xlim(self.x_min - 10, self.x_max + 10)
            plt.ylim(self.y_min - 10, self.y_max + 10)

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["bottom"].set_visible(False)
        ax.spines["left"].set_visible(False)

        plt.gca().set_aspect("equal", adjustable="box")

        plt.show()

    def save(
        self, clear_output_before_save: bool = True, include_layer_number: bool = True
    ) -> None:
        """
        Save all the layers to the output directory defined by the `output_directory` Plotter param. Each layer will be
        saved as an individual file with the filename defined by `{layer_number}_{layer_title}.gcode`.

        Args:
        - clear_output_before_save (bool, optional): Whether to remove all files from the artwork output directory
            (defined as `[output_directory]/[title]`) before saving. Defaults to True.
        - include_layer_number (bool, optional): Whether to prepend filename with `layer_number`. Defaults to True.
        """

        artwork_directory = os.path.join(self.output_directory, self.title)
        if clear_output_before_save and os.path.exists(artwork_directory):
            shutil.rmtree(artwork_directory)
        if not os.path.exists(artwork_directory):
            os.makedirs(artwork_directory)

        self._add_preview_layer()

        # Set preview layer as first
        titles = list(self.layers.keys())
        titles.remove("preview")
        titles.insert(0, "preview")

        for index, title in enumerate(titles):
            file_name = f"{title}.gcode"
            if include_layer_number:
                file_name = f"{index}_" + file_name
            self.layers[title].save(
                os.path.join(self.output_directory, self.title, file_name)
            )


class Plotter2D(_AbstractPlotter):
    """
    `Plotter2D` is a 2D plotter for creating artwork using G-code. This class should be used with a 2D plotter.

    `Plotter2D` extends from the abstract class `Plotter`.
    """

    def __init__(
        self,
        title: str,
        x_min: float,
        x_max: float,
        y_min: float,
        y_max: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds = "Warning",
        output_directory: str = "./output",
    ) -> None:
        """
        Args:
        - title (str) : The title of the work of art.
        - x_min (float) : The minimum X-coordinate of the plotter.
        - y_min (float) : The minimum Y-coordinate of the plotter.
        - x_max (float) : The maximum X-coordinate of the plotter.
        - y_max (float) : The maximum Y-coordinate of the plotter.
        - feed_rate (float) : The feed rate for the plotter.
        - handle_out_of_bounds (`Warning` | `Error`, optional):
            How to handle out-of-bounds points.
            `Warning` will print a warning, skip the point, and continue.
            `Error` will throw an error and stop.
            Defaults to `Warning`.
        - output_directory (str, optional) : The directory where G-code files will be saved. Defaults to `./output`.
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
        )

    def add_layer(
        self,
        title: str,
        color: Optional[str] = None,
        line_width: float = 2.0,
        preview_only: bool = False,
    ) -> Layer2D:
        new_layer = Layer2D(
            x_min=self.x_min,
            x_max=self.x_max,
            y_min=self.y_min,
            y_max=self.y_max,
            feed_rate=self.feed_rate,
            handle_out_of_bounds=self.handle_out_of_bounds,
            preview_only=preview_only,
            line_width=line_width,
            color=color,
        )
        self.layers[title] = new_layer

        return new_layer


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
    ) -> None:
        """
        Initializes a new instance of the Plotter3D class.

        Args:
        - title (str) : The title of the work of art.
        - x_min (float) : The minimum X-coordinate of the plotter.
        - y_min (float) : The minimum Y-coordinate of the plotter.
        - x_max (float) : The maximum X-coordinate of the plotter.
        - y_max (float) : The maximum Y-coordinate of the plotter.
        - z_plotting_height (float) : The height of the drawing instrument when plotting on the plotting surface.
        - z_navigation_height (float) : The height of the drawing instrument when navigating to a new location.
        - feed_rate (float) : The feed rate for the plotter.
        - handle_out_of_bounds (`Warning` | `Error`, optional):
          How to handle out-of-bounds points.
          `Warning` will print a warning, skip the point, and continue.
          `Error` will throw an error and stop.
          Defaults to `Warning`.
        - output_directory (str, optional) : The directory where G-code files will be saved. Defaults to `./output`.
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
        - color (Optional[str], optional): The color of the layer. Defaults to None.
        - line_width (float, optional): The line width of the layer. Defaults to 2.0.
        - preview_only (bool, optional): Whether the layer is for preview only. Defaults to False.

        Returns:
        - Layer3D: The newly created layer.
        """

        new_layer = Layer3D(
            x_min=self.x_min,
            x_max=self.x_max,
            y_min=self.y_min,
            y_max=self.y_max,
            feed_rate=self.feed_rate,
            handle_out_of_bounds=self.handle_out_of_bounds,
            preview_only=preview_only,
            line_width=line_width,
            z_plotting_height=self.z_plotting_height,
            z_navigation_height=self.z_navigation_height,
            color=color,
        )

        self.layers[title] = new_layer

        return new_layer
