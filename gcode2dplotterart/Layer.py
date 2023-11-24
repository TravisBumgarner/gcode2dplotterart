from typing import List, Tuple, Union, Dict, Optional
from typing_extensions import Self
import math
from abc import ABC, abstractmethod
import secrets

from .types import THandleOutOfBounds, TInstructionType
from .InstructionWithArguments import (
    InstructionPoint,
    Instruction3DPrinterPlottingHeight,
    InstructionComment,
    InstructionFeedRate,
    InstructionPause,
    Instruction3DPrinterNavigationHeight,
)

from .SimpleInstruction import (
    Instruction2DPlotterNavigationHeight,
    Instruction2DPlotterPlottingHeight,
    InstructionUnitsMM,
    InstructionProgramEnd,
)

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

x = 5
x = 10

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


class Layer(ABC):
    instructions: Dict[TInstructionType, List[TInstructionUnion]]

    def __init__(
        self,
        x_min: float,
        y_min: float,
        x_max: float,
        y_max: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds,
        color: Optional[str],
        line_width: float,
        preview_only: bool = False,
    ):
        self.color = color if color else f"#{secrets.token_hex(3, )}"

        self.instructions: Dict[TInstructionType, TInstructionUnion] = {
            "setup": [],
            "plotting": [],
            "teardown": [],
        }
        self.preview_only = preview_only

        # For calculating if a point is out of the range of the plotter.
        self.plotter_x_min = x_min
        self.plotter_x_max = x_max
        self.plotter_y_min = y_min
        self.plotter_y_max = y_max

        # For plotting a bounding box before printing.
        self.layer_x_min = x_max
        self.layer_x_max = x_min
        self.layer_y_min = y_max
        self.layer_y_max = y_min

        self.feed_rate = feed_rate

        self.handle_out_of_bounds = handle_out_of_bounds

        self.line_width = line_width

        self.add_comment(SETUP_INSTRUCTIONS_DISPLAY, "setup")
        self.add_comment(PLOTTING_INSTRUCTIONS_DISPLAY, "plotting")
        self.add_comment(TEARDOWN_INSTRUCTIONS_DISPLAY, "teardown")

        self.add_instruction(InstructionUnitsMM(), "setup")

        self.set_feed_rate(feed_rate, "setup")

        self.add_instruction(Instruction2DPlotterNavigationHeight(), "setup")
        self.add_instruction(InstructionPause(), "setup")

        self.add_instruction(InstructionProgramEnd(), "teardown")

    def _update_max_and_min(self, x: float, y: float) -> None:
        """
        Updates the current max and min values for the bounding box of the layer.

        Args:
          x : float
            The x-coordinate of the point to add.
          y : float
            The y-coordinate of the point to add.
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
          dict : {x_min (float), y_min (float), x_max (float), y_max (float)}
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
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """Set the speed at which the plotter head moves.

        Args:
          feed_rate (float) : The feed rate to set.
          instruction_type (str, optional) : The type of instruction to use. Defaults to `plotting`.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(
            f"Set the feed rate of the layer to {feed_rate}", instruction_type
        )
        self.instructions[instruction_type].append(InstructionFeedRate(feed_rate))
        return self

    @abstractmethod
    def set_mode_to_plotting(
        self,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Connect plotting instrument to plotting surface. Should be used when starting a path.

        Args:
          instruction_type (str, optional) : The type of instruction to use. Defaults to `plotting`.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """

        pass

    @abstractmethod
    def set_mode_to_navigation(
        self,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Separate plotting instrument from plotting surface. Should be used once plotting a path is
        complete before moving on to the next path.

        Args:
          instruction_type (str, optional) : The type of instruction to use. Defaults to `plotting`.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """

        pass

    def add_point(
        self,
        x: float,
        y: float,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Add a point to the layer. Typically not used directly, instead use one of the other add methods.

        Args:
          x (float) : The x-coordinate of the point.
          y (float) : The y-coordinate of the point.
          instruction_type (str, optional): The type of instruction to use. Defaults to `plotting`.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """
        if (
            x > self.plotter_x_max
            or y > self.plotter_y_max
            or x < self.plotter_x_min
            or y < self.plotter_y_min
        ):
            if self.handle_out_of_bounds == "Warning":
                print("Failed to add point, outside dimensions of plotter", x, y)
                # Todo - Can this cause an error with pen up / pen down instructions?
                return self
            elif self.handle_out_of_bounds == "Error":
                raise ValueError(
                    "Failed to add point, outside dimensions of plotter", x, y
                )
            elif self.handle_out_of_bounds == "Silent":
                # Typically only used in testing to keep things quiet
                pass
            else:
                raise ValueError(
                    "Invalid value for handle_out_of_bounds received",
                    self.handle_out_of_bounds,
                )
        self.add_comment(f"Point: {x}, {y}", instruction_type)
        self._update_max_and_min(x, y)

        point = InstructionPoint(self.feed_rate, x, y)
        self.instructions[instruction_type].append(point)
        return self

    def add_line(
        self,
        x_start: float,
        y_start: float,
        x_end: float,
        y_end: float,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Add a line to the layer.

        Args:
          x_start (float) : The x-coordinate of the starting point of the line.
          y_start (float) : The y-coordinate of the starting point of the line.
          x_end (float) : The x-coordinate of the ending point of the line.
          y_end (float) : The y-coordinate of the ending point of the line.
          instruction_type (str, optional) : The type of instruction to use. Defaults to `plotting`.
        """

        points = [(x_start, y_start), (x_end, y_end)]
        self.add_comment(
            f"Line: {x_start}, {y_start}, {x_end}, {y_end}", instruction_type
        )
        self.add_path(points, instruction_type)
        return self

    def add_path(
        self,
        points: List[Tuple[float, float]],
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Add a path to the layer. A path is a series of points that are connected by lines.

        Args:
          points (List[Tuple[float, float]]) : An array of points to add.
          instruction_type (str, optional) : The type of instruction to use. Defaults to `plotting`.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(f"Path: {points}", instruction_type)
        for index, [x, y] in enumerate(points):
            self.add_point(x, y, instruction_type)
            if index == 0 and not self.preview_only:
                self.set_mode_to_plotting()
        self.set_mode_to_navigation()
        return self

    def add_instruction(
        self,
        instruction: Union[
            InstructionPause,
            InstructionFeedRate,
            InstructionComment,
            Instruction3DPrinterPlottingHeight,
            Instruction3DPrinterNavigationHeight,
            Instruction2DPlotterNavigationHeight,
            Instruction2DPlotterPlottingHeight,
            InstructionUnitsMM,
            InstructionProgramEnd,
        ],
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Add a special instruction.

        Args:
          special_instruction (InstructionEnum) : See `InstructionEnum` for special instruction definitions.
          instruction_type (str, optional) : The type of instruction to use.

        Returns:
          Layer: The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(str(instruction), instruction_type)
        self.instructions[instruction_type].append(instruction)
        return self

    def add_comment(self, text: str, instruction_type: TInstructionType) -> Self:
        """Add a comment to the layer.

        Args:
          text (str): The text to add.
          instruction_type (str, optional): The type of instruction to use.

        Returns:
          Layer: The Layer object. Allows for chaining of add methods.
        """

        lines = text.split("\n")
        for line in lines:
            self.instructions[instruction_type].append(InstructionComment(line))

        return self

    def add_rectangle(
        self,
        x_start: float,
        y_start: float,
        x_end: float,
        y_end: float,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Adds a rectangle to the layer.

        Args:
          x_start (float) : The x-coordinate of the starting point of the rectangle.
          y_start (float) : The y-coordinate of the starting point of the rectangle.
          x_end (float) : The x-coordinate of the ending point of the rectangle.
          y_end (float) : The y-coordinate of the ending point of the rectangle.
          instruction_type (str, optional) : The type of instruction to use. Defaults to `plotting`.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """
        self.add_comment(
            f"Rectangle: {x_start}, {y_start}, {x_end}, {y_end}", instruction_type
        )
        points = [
            (x_start, y_start),
            (x_start, y_end),
            (x_end, y_end),
            (x_end, y_start),
            (x_start, y_start),
        ]
        self.add_path(points, instruction_type)
        return self

    def add_circle(
        self,
        x_center: float,
        y_center: float,
        radius: float,
        num_points: int = 36,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        """
        Adds a circle to the layer.

        Args:
          x_center (float) : The x-coordinate of the center of the circle.
          y_center (float) : The y-coordinate of the center of the circle.
          radius (float) : The radius of the circle.
          num_points (int) : The number of points to use to approximate the circle. Default is 36.
          instruction_type (float) : The type of instruction to use. Default is 'plotting'.

        Returns:
          Layer : The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(
            f"Circle: {x_center}, {y_center}, {radius}, {num_points}", instruction_type
        )

        # Calculate angle step between points to approximate the circle
        angle_step = 360.0 / num_points

        self.add_instruction(Instruction2DPlotterNavigationHeight(), instruction_type)
        self.add_instruction(InstructionPause(), instruction_type)

        points: List[Tuple[float, float]] = []
        for point in range(num_points):
            angle = math.radians(point * angle_step)
            x = x_center + radius * math.cos(angle)
            y = y_center + radius * math.sin(angle)
            points.append((x, y))
        self.add_path(points, instruction_type)
        return self

    def save(self, file_path: str) -> None:
        """
        Saves the layer instructions to a file at the specified file path.

        Args:
          file_path (str) : The path to the file where the layer instructions will be saved.
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

    def preview_paths(self) -> List[List[Tuple[float, float]]]:
        """
        Generate an array of paths for the given layer. This will be used by the `Plotter`
        to generate a preview graph of the plot. Only looks at instructions during the `plotting`
        phase.

        Returns:
          List[List[Tuple[float, float]]]
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
          dict: {"setup": [], "plotting": [], "teardown": []}
            A dictionary containing the setup, plotting, and teardown instructions as an array of G-Code
            instruction strings.
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


class Layer2d(Layer):
    def __init__(
        self,
        x_min: float,
        y_min: float,
        x_max: float,
        y_max: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds,
        color: Optional[str],
        line_width,
        preview_only: bool = False,
    ) -> None:
        """
        Args:
            title (str) : The title of the work of art.
            x_min (float) : The minimum X-coordinate of the plotter.
            y_min (float) : The minimum Y-coordinate of the plotter.
            x_max (float) : The maximum X-coordinate of the plotter.
            y_max (float) : The maximum Y-coordinate of the plotter.
            feed_rate (float) : The feed rate for the plotter.
            handle_out_of_bounds (`Warning` | `Error` | `Silent`, optional):
              How to handle out-of-bounds points.
              `Warning` will print a warning, skip the point, and continue.
              `Error` will throw an error and stop.
              `Silent` will skip the point and continue.
              Defaults to `Warning`.
            color (str, optional) : The color of the layer. Defaults to a random color.
            line_width (float) : The width of the line
            preview_only (bool, optional) : If true, the layer will not be plotted. Defaults to False.
        """
        super().__init__(
            x_min=x_min,
            y_min=y_min,
            x_max=x_max,
            y_max=y_max,
            feed_rate=feed_rate,
            handle_out_of_bounds=handle_out_of_bounds,
            preview_only=preview_only,
            line_width=line_width,
            color=color,
        )

    def set_mode_to_plotting(
        self,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        self.add_instruction(Instruction2DPlotterPlottingHeight(), instruction_type)
        self.add_instruction(InstructionPause(), instruction_type)

        return self

    def set_mode_to_navigation(
        self,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        self.add_instruction(Instruction2DPlotterNavigationHeight(), instruction_type)
        self.add_instruction(InstructionPause(), instruction_type)

        return self


class Layer3d(Layer):
    z_plotting_height: float
    z_navigation_height: float

    def __init__(
        self,
        x_min: float,
        y_min: float,
        x_max: float,
        y_max: float,
        z_plotting_height: float,
        z_navigation_height: float,
        feed_rate: float,
        handle_out_of_bounds: THandleOutOfBounds,
        color: Optional[str],
        line_width: float,
        preview_only: bool = False,
    ) -> None:
        """
        Args:
            title (str) : The title of the work of art.
            x_min (float) : The minimum X-coordinate of the plotter.
            y_min (float) : The minimum Y-coordinate of the plotter.
            x_max (float) : The maximum X-coordinate of the plotter.
            y_max (float) : The maximum Y-coordinate of the plotter.
            z_plotting_height (float) : The height of the drawing instrument when plotting on the plotting surface.
            z_navigation_height (float) : The height of the drawing instrument when navigating to a new location.
            feed_rate (float) : The feed rate for the plotter.
            handle_out_of_bounds (`Warning` | `Error` | `Silent`, optional):
              How to handle out-of-bounds points.
              `Warning` will print a warning, skip the point, and continue.
              `Error` will throw an error and stop.
              `Silent` will skip the point and continue.
              Defaults to `Warning`.
            color (str, optional) : The color of the layer. Defaults to a random color.
            line_width (float) : The width of the line
            preview_only (bool, optional) : If true, the layer will not be plotted. Defaults to False.
        """
        super().__init__(
            x_min=x_min,
            y_min=y_min,
            x_max=x_max,
            y_max=y_max,
            feed_rate=feed_rate,
            handle_out_of_bounds=handle_out_of_bounds,
            preview_only=preview_only,
            line_width=line_width,
            color=color,
        )
        self.z_plotting_height = z_plotting_height
        self.z_navigation_height = z_navigation_height

    def set_mode_to_plotting(
        self,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        self.add_instruction(Instruction2DPlotterPlottingHeight(), instruction_type)
        self.add_instruction(InstructionPause(), instruction_type)

        return self

    def set_mode_to_navigation(
        self,
        instruction_type: TInstructionType = "plotting",
    ) -> Self:
        self.add_instruction(Instruction2DPlotterNavigationHeight(), instruction_type)
        self.add_instruction(InstructionPause(), instruction_type)

        return self
