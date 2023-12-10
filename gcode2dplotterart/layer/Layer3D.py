from typing import Optional
from typing_extensions import Self

from ._Layer import _AbstractLayer
from ..shared_types import THandleOutOfBounds, TInstructionPhase
from ..instruction import (
    Instruction3DPrinterNavigationHeight,
    Instruction3DPrinterPlottingHeight,
    InstructionPause,
)


class Layer3D(_AbstractLayer):
    """
    `Layer3D` is a layer for a 3D plotter. Layers are added via the `Plotter3D.add_layer` method.

    `Layer3D` extends from the abstract class `Layer`.
    """

    z_plotting_height: float
    z_navigation_height: float

    def __init__(
        self,
        plotter_x_min: float,
        plotter_y_min: float,
        plotter_x_max: float,
        plotter_y_max: float,
        z_plotting_height: float,
        z_navigation_height: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds,
        color: Optional[str],
        line_width: float,
        include_comments: bool,
        preview_only: bool = False,
    ) -> None:
        """
        Args:
        - plotter_x_min (float) : The minimum X-coordinate of the plotter.
        - plotter_y_min (float) : The minimum Y-coordinate of the plotter.
        - plotter_x_max (float) : The maximum X-coordinate of the plotter.
        - plotter_y_max (float) : The maximum Y-coordinate of the plotter.
        - z_plotting_height (float) : The height of the
          [plotting instrument](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase) when plotting on the
          [plotting surface](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument).
        - z_navigation_height (float) : The height of the
          [plotting instrument](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
          when navigating to a new location.
        - feed_rate (float) : The [feed rate](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate) for the plotter.
        - handle_out_of_bounds (`Warning` | `Error`, optional):
            How to handle out-of-bounds points.
            `Warning` will print a warning, skip the point, and continue.
            `Error` will throw an error and stop.
            Defaults to `Warning`.
        - color (str, optional) : The color of the layer. Defaults to a random color.
        - line_width (float) : The width of the line being plotted.
        - preview_only (bool, optional) : If true, the layer will not be plotted. Defaults to `False`.
        - include_comments (bool, optional) : Whether to include comments in the G-Code files. Useful for learning about G-Code and debugging.

        """
        super().__init__(
            plotter_x_min=plotter_x_min,
            plotter_y_min=plotter_y_min,
            plotter_x_max=plotter_x_max,
            plotter_y_max=plotter_y_max,
            feed_rate=feed_rate,
            handle_out_of_bounds=handle_out_of_bounds,
            preview_only=preview_only,
            line_width=line_width,
            color=color,
            include_comments=include_comments,
        )
        self.z_plotting_height = z_plotting_height
        self.z_navigation_height = z_navigation_height

        self.set_mode_to_navigation("setup")

    def set_mode_to_plotting(
        self,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        self._add_instruction(
            Instruction3DPrinterPlottingHeight(
                z_plotting_height=self.z_plotting_height
            ),
            instruction_phase,
        )
        self._add_instruction(InstructionPause(), instruction_phase)

        return self

    def set_mode_to_navigation(
        self,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        self._add_instruction(
            Instruction3DPrinterNavigationHeight(
                z_navigating_height=self.z_navigation_height
            ),
            instruction_phase,
        )
        self._add_instruction(InstructionPause(), instruction_phase)

        return self
