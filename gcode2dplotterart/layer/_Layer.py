from typing import List, Tuple, Union, Dict, Optional
from typing_extensions import Self
import math
from abc import ABC, abstractmethod
import secrets

from ..shared_types import THandleOutOfBounds, TInstructionPhase
from ..instruction import (
    InstructionPoint,
    Instruction3DPrinterPlottingHeight,
    InstructionComment,
    InstructionFeedRate,
    InstructionPause,
    Instruction3DPrinterNavigationHeight,
    Instruction2DPlotterNavigationHeight,
    Instruction2DPlotterPlottingHeight,
    InstructionUnitsMM,
    InstructionProgramEnd,
)
from .draw_character import draw_character

SETUP_INSTRUCTIONS_DISPLAY = """
######################################################################################################
##############################            SETUP INSTRUCTIONS            ##############################
######################################################################################################"""

PLOTTING_INSTRUCTIONS_DISPLAY = """
######################################################################################################
##############################           PLOTTING INSTRUCTIONS          ##############################
######################################################################################################"""

TEARDOWN_INSTRUCTIONS_DISPLAY = """
######################################################################################################
##############################           TEARDOWN INSTRUCTIONS          ##############################
######################################################################################################"""

TInstructionUnion = Union[
    InstructionPoint,
    InstructionComment,
    InstructionFeedRate,
    Instruction2DPlotterPlottingHeight,
    Instruction2DPlotterNavigationHeight,
    InstructionPause,
    InstructionUnitsMM,
    InstructionProgramEnd,
    Instruction3DPrinterPlottingHeight,
    Instruction3DPrinterNavigationHeight,
]


class _AbstractLayer(ABC):
    instructions: Dict[TInstructionPhase, List[TInstructionUnion]]

    def __init__(
        self,
        plotter_x_min: float,
        plotter_y_min: float,
        plotter_x_max: float,
        plotter_y_max: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds,
        color: Optional[str],
        line_width: float,
        include_comments: bool,
        preview_only: bool = False,
    ):
        self.color = color if color else f"#{secrets.token_hex(3, )}"

        self.instructions: Dict[TInstructionPhase, TInstructionUnion] = {
            "setup": [],
            "plotting": [],
            "teardown": [],
        }
        self.preview_only = preview_only

        # For calculating if a point is out of the range of the plotter.
        self.plotter_x_min = plotter_x_min
        self.plotter_x_max = plotter_x_max
        self.plotter_y_min = plotter_y_min
        self.plotter_y_max = plotter_y_max

        # For plotting a bounding box before printing.
        self.layer_x_min = plotter_x_max
        self.layer_x_max = plotter_x_min
        self.layer_y_min = plotter_y_max
        self.layer_y_max = plotter_y_min

        self.feed_rate = feed_rate

        self.handle_out_of_bounds = handle_out_of_bounds

        self.line_width = line_width

        self.include_comments = include_comments

        self.add_comment(SETUP_INSTRUCTIONS_DISPLAY, "setup")
        self.add_comment(PLOTTING_INSTRUCTIONS_DISPLAY, "plotting")
        self.add_comment(TEARDOWN_INSTRUCTIONS_DISPLAY, "teardown")

        self._add_instruction(InstructionUnitsMM(), "setup")

        self.set_feed_rate(feed_rate, "setup")

        self._add_instruction(InstructionProgramEnd(), "teardown")

    def _update_max_and_min(self, x: float, y: float) -> None:
        """
        Updates the current max and min values for the bounding box of the layer.

        Args:
        - x : (float) The x-coordinate of the point to add.
        - y : (float) The y-coordinate of the point to add.
        """
        if x < self.layer_x_min:
            self.layer_x_min = x
        if x > self.layer_x_max:
            self.layer_x_max = x
        if y < self.layer_y_min:
            self.layer_y_min = y
        if y > self.layer_y_max:
            self.layer_y_max = y

    def get_min_and_max_points(self) -> Dict[str, float]:
        """
        Find the min and max plot points of the layer.

        Returns:
        - dict : {x_min (float), y_min (float), x_max (float), y_max (float)}
            A dictionary containing the min and max plot points of the layer.
        """

        return {
            "x_min": self.layer_x_min,
            "y_min": self.layer_y_min,
            "x_max": self.layer_x_max,
            "y_max": self.layer_y_max,
        }

    def set_feed_rate(
        self,
        feed_rate: float,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Set the speed at which the [plotter head](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument)
        moves.

        Args:
        - feed_rate (float) : The [feed rate](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate) to set.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional) : The
          [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
          of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """

        self._add_instruction(InstructionFeedRate(feed_rate), instruction_phase)
        return self

    @abstractmethod
    def set_mode_to_plotting(
        self,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Connect [plotting instrument](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument)
          to [plotting surface](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument).
          Should be used when starting a path.

        Args:
        - instruction_phase (`setup` | `plotting` | `teardown`, optional) : The instruction
        phase of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """

        pass

    @abstractmethod
    def set_mode_to_navigation(
        self,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Separate [plotting instrument](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument)
        from [plotting surface](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-surface).
        Should be used once plotting a path is complete before moving on to the next path.

        Args:
        - instruction_phase (`setup` | `plotting` | `teardown`, optional) :
          The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
          of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """

        pass

    def _add_coordinate(
        self, x: float, y: float, instruction_phase: TInstructionPhase
    ) -> Self:
        """
        Add a coordinate to the layer. Typically not used directly, instead use one of the other add methods.
        """
        self._update_max_and_min(x, y)

        point = InstructionPoint(self.feed_rate, x, y)
        self._add_instruction(point, instruction_phase)
        return self

    def _add_instruction(
        self, instruction: TInstructionUnion, instruction_phase: TInstructionPhase
    ) -> Self:
        if not isinstance(instruction, InstructionComment) and self.include_comments:
            self.instructions[instruction_phase].append(
                InstructionComment(str(instruction))
            )
        self.instructions[instruction_phase].append(instruction)
        return self

    def add_comment(self, text: str, instruction_phase: TInstructionPhase) -> Self:
        """Add a comment to the layer.

        Args:
        - text (str): The text to add.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional):
        The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
        of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer: The Layer object. Allows for chaining of add methods.
        """
        if self.include_comments is True:
            lines = text.split("\n")
            for line in lines:
                self._add_instruction(InstructionComment(line), instruction_phase)

        return self

    def add_path(
        self,
        points: List[Tuple[float, float]],
        raise_plotter_head_after_path: bool = True,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Add a path to the layer. A path is a series of points that are connected by lines.

        Args:
        - points (List[Tuple[float, float]]) : An array of (x,y) points to add.
        - raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent
          paths are plotted nearby. Defaults to `True`.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional) : The instruction
          phase of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """
        out_of_bounds_points = []
        for point in points:
            if not self._is_point_in_bounds(point[0], point[1]):
                out_of_bounds_points.append(point)

        if len(out_of_bounds_points) > 0:
            if self.handle_out_of_bounds == "Warning":
                print(
                    "Failed to add path with points outside of plotter's dimensions",
                    out_of_bounds_points,
                )
                return self
            elif self.handle_out_of_bounds == "Error":
                raise ValueError(
                    "Failed to add path with points outside of plotter's dimensions",
                    out_of_bounds_points,
                )
            else:
                raise ValueError(
                    "Invalid value for handle_out_of_bounds received",
                    self.handle_out_of_bounds,
                )

        self.add_comment(f"Path: {points}", instruction_phase)
        for index, [x, y] in enumerate(points):
            self._add_coordinate(x, y, instruction_phase)
            if index == 0 and not self.preview_only:
                self.set_mode_to_plotting(instruction_phase=instruction_phase)
        if raise_plotter_head_after_path:
            self.set_mode_to_navigation(instruction_phase=instruction_phase)
        return self

    def add_point(
        self,
        x: float,
        y: float,
        raise_plotter_head_after_path: bool = True,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Add a point to the layer. `add_point` calls `add_path` under the hood, for more control, use `add_path` directly.

        Args:
        - x (float) : The x-coordinate of the point.
        - y (float) : The y-coordinate of the point.
        - raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent
          paths are plotted nearby. Defaults to `True`.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional):
          The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
          of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(f"Point: {x}, {y}", instruction_phase)
        self.add_path(
            [(x, y)],
            raise_plotter_head_after_path=raise_plotter_head_after_path,
            instruction_phase=instruction_phase,
        )
        return self

    def add_line(
        self,
        x_start: float,
        y_start: float,
        x_end: float,
        y_end: float,
        raise_plotter_head_after_path: bool = True,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Add a line to the layer. `add_line` calls `add_path` under the hood, for more control, use `add_path` directly.

        Args:
        - x_start (float) : The x-coordinate of the starting point of the line.
        - y_start (float) : The y-coordinate of the starting point of the line.
        - x_end (float) : The x-coordinate of the ending point of the line.
        - y_end (float) : The y-coordinate of the ending point of the line.
        - raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent
          paths are plotted nearby. Defaults to `True`.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional) :
          The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
          of plotting to send the instruction to. Defaults to `plotting`.
        """

        points = [(x_start, y_start), (x_end, y_end)]
        self.add_comment(
            f"Line: {x_start}, {y_start}, {x_end}, {y_end}", instruction_phase
        )
        self.add_path(
            points,
            raise_plotter_head_after_path=raise_plotter_head_after_path,
            instruction_phase=instruction_phase,
        )
        return self

    def add_rectangle(
        self,
        x_start: float,
        y_start: float,
        x_end: float,
        y_end: float,
        raise_plotter_head_after_path: bool = True,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Adds a rectangle to the layer.  `add_rectangle` calls `add_path` under the hood, for more control, use `add_path` directly.

        Args:
        - x_start (float) : The x-coordinate of the starting point of the rectangle.
        - y_start (float) : The y-coordinate of the starting point of the rectangle.
        - x_end (float) : The x-coordinate of the ending point of the rectangle.
        - y_end (float) : The y-coordinate of the ending point of the rectangle.
        - raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent
          paths are plotted nearby. Defaults to `True`.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional) :
        The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
        of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """
        self.add_comment(
            f"Rectangle: {x_start}, {y_start}, {x_end}, {y_end}", instruction_phase
        )
        points = [
            (x_start, y_start),
            (x_start, y_end),
            (x_end, y_end),
            (x_end, y_start),
            (x_start, y_start),
        ]
        self.add_path(
            points,
            raise_plotter_head_after_path=raise_plotter_head_after_path,
            instruction_phase=instruction_phase,
        )
        return self

    def add_circle(
        self,
        x_center: float,
        y_center: float,
        radius: float,
        num_points: int = 36,
        raise_plotter_head_after_path: bool = True,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Adds a circle to the layer. `add_circle` calls `add_path` under the hood, for more control, use `add_path` directly.

        Args:
        - x_center (float) : The x-coordinate of the center of the circle.
        - y_center (float) : The y-coordinate of the center of the circle.
        - radius (float) : The radius of the circle.
        - num_points (int) : The number of points to use to approximate the circle. More points leads to a circle with less visible straight lines.
          Defaults to `36`.
        - raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent
          paths are plotted nearby. Defaults to `True`.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional):
        The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
        of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(
            f"Circle: {x_center}, {y_center}, {radius}, {num_points}", instruction_phase
        )

        # Calculate angle step between points to approximate the circle
        angle_step = 360.0 / num_points

        points: List[Tuple[float, float]] = []
        for point in range(num_points):
            angle = math.radians(point * angle_step)
            x = x_center + radius * math.cos(angle)
            y = y_center + radius * math.sin(angle)
            points.append((x, y))
        points.append(points[0])  # Close the circle
        self.add_path(
            points,
            raise_plotter_head_after_path=raise_plotter_head_after_path,
            instruction_phase=instruction_phase,
        )
        return self

    def add_text(
        self,
        text: str,
        font_size: float,
        x_start: float,
        y_start: float,
        char_spacing: Optional[float] = None,
        point_offset: Optional[float] = None,
        instruction_phase: TInstructionPhase = "plotting",
    ) -> Self:
        """
        Adds a text to the layer. `add_text` calls `add_path` under the hood, for more control, use `add_path` directly.

        Args:
        - text (str) : The text to add.
        - font_size (float) : The height of each character of text in mm.
        - x_start (float) : The x-coordinate of the starting point of the text. Located to the left of the text.
        - y_start (float) : The y-coordinate of the starting point of the text. Located at the bottom of the text.
        - char_spacing (float) : The spacing between each character in mm. Defaults to layer `line_width`.
        - point_offset (float, optional) : The offset of the point in the character, units are mm. Used for characters such as `!`.
          Defaults to the layer `line_width`.
        - instruction_phase (`setup` | `plotting` | `teardown`, optional):
          The [instruction phase](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase)
          of plotting to send the instruction to. Defaults to `plotting`.

        Returns:
        - Layer : The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(f"Text: {text}", instruction_phase)
        segment_length = font_size / 2

        for character in text.lower():
            paths = draw_character(
                character=character,
                x_start=x_start,
                y_start=y_start,
                segment_length=segment_length,
                point_offset=self.line_width if point_offset is None else point_offset,
            )

            for path in paths:
                self.add_path(path)

            x_start += segment_length
            x_start += char_spacing if char_spacing is not None else segment_length

        return self

    def save(self, file_path: str) -> None:
        """
        Saves the layer instructions to a file at the specified file path.

        Args:
        - file_path (str) : The path to the file where the layer instructions will be saved.
        """
        with open(file_path, "w") as file:
            file.write(
                "\n".join(
                    [
                        instruction.to_g_code()
                        for instruction in self.instructions["setup"]
                    ]
                )
            )
            file.write(
                "\n".join(
                    [
                        instruction.to_g_code()
                        for instruction in self.instructions["plotting"]
                    ]
                )
            )
            file.write(
                "\n".join(
                    [
                        instruction.to_g_code()
                        for instruction in self.instructions["teardown"]
                    ]
                )
            )

    def _is_point_in_bounds(self, x: float, y: float) -> bool:
        """
        Whether the point to be plotted is within the plotter bounds.

        Args:
        - x (float) : The x-coordinate of the point to be plotted.
        - y (float) : The y-coordinate of the point to be plotted.

        Returns:
        - bool : Whether the point to be plotted is within the plotter bounds.
        """

        too_low = x < self.plotter_x_min or y < self.plotter_y_min
        too_high = x > self.plotter_x_max or y > self.plotter_y_max

        return not too_low and not too_high

    def preview_paths(self) -> List[List[Tuple[float, float]]]:
        """
        Generate an array of paths for the given layer. This will be used by the `Plotter`
        to generate a preview image of what will be plotted. Only looks at instructions during the `plotting`
        phase.

        Returns:
        - List[List[Tuple[float, float]]]
            An array of paths for the given layer.
        """
        is_plotting = False  # Layer is set to initially be in navigation mode.
        paths: List[List[Tuple[float, float]]] = []
        current_path: List[Tuple[float, float]] = []
        # Before the plotter begins plotting, it needs to move to a point, switch to plotting mode, and begin plotting.
        # This will hold the most recent navigation point before the switch to plotting mode is made.
        previous_navigation_point = None

        for instruction in self.instructions["plotting"]:
            if isinstance(
                instruction, Instruction2DPlotterNavigationHeight
            ) or isinstance(instruction, Instruction3DPrinterNavigationHeight):
                is_plotting = False
                if len(current_path) > 0:
                    paths.append(current_path)
                    current_path = []

            if isinstance(
                instruction, Instruction2DPlotterPlottingHeight
            ) or isinstance(instruction, Instruction3DPrinterPlottingHeight):
                is_plotting = True
                if previous_navigation_point:
                    current_path.append(previous_navigation_point)
                    previous_navigation_point = None

            if not is_plotting and isinstance(instruction, InstructionPoint):
                previous_navigation_point = (instruction.x, instruction.y)

            if is_plotting and isinstance(instruction, InstructionPoint):
                current_path.append((instruction.x, instruction.y))

        return paths

    def get_plotting_data(self) -> Dict[str, List[str]]:
        """
        Get current plotting data.

        Returns:
        - dict: {"setup": [], "plotting": [], "teardown": []}
            A dictionary containing
            [instruction phases](https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase) - setup, plotting,
            and teardown as an array of G-Code instruction strings per layer. Mostly used for testing purposes.
        """
        return {
            "setup": [
                instruction.to_g_code() for instruction in self.instructions["setup"]
            ],
            "plotting": [
                instruction.to_g_code() for instruction in self.instructions["plotting"]
            ],
            "teardown": [
                instruction.to_g_code() for instruction in self.instructions["teardown"]
            ],
        }
