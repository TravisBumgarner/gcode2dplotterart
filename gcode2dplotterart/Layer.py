from typing import List, Tuple, Union, Dict
from typing_extensions import Self
import math

from .enums import (
    HandleOutOfBoundsEnum,
    SpecialInstructionEnum,
    PlottingInstructionTypeEnum,
    UnitsEnum,
    PlotterTypeEnum,
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


class Point:
    """
    A class representing a point in 2D space with an optional feed rate.

    Attributes
    feed_rate : float
      The feed rate of the point.
    x : float
      The x-coordinate of the point.
    y : float
      The y-coordinate of the point.

    Raises:
    ValueError
        If x or y is not provided.
    """

    def __init__(self, feed_rate: float, x: float, y: float):
        self.x = x
        self.y = y
        self.feed_rate = feed_rate

        if x is None or y is None:
            raise ValueError("Point requires an X or Y")

    def to_g_code(self) -> str:
        """
        Convert instruction to G-Code.

        Returns:
        string
          A point in G-Code format.
        """
        output = "G1 "
        if self.x is not None:
            output += f"X{self.x:.3f} "
        if self.y is not None:
            output += f"Y{self.y:.3f} "
        output += f"F{self.feed_rate}"
        return output


class Comment:
    """
    A class representing a comment in G-Code.

    Attributes
      text : str
        The text of the comment.
    """

    def __init__(self, text: str):
        self.text = text

    def to_g_code(self) -> str:
        """
        Convert instruction to G-Code.

        Returns:
          string
            A comment in G-Code format.
        """
        return f"\n;{self.text}"


class FeedRate:
    """
    A class representing the feed rate in G-Code.

    Attributes
    feed_rate : float
      The feed rate.
    """

    def __init__(self, feed_rate: float):
        self.feed_rate = feed_rate

    def to_g_code(self) -> str:
        """
        Convert instruction to G-Code.

        Returns:
        string
          The feed rate in G-Code format.
        """
        return f"\nF{self.feed_rate}"


class SpecialInstruction:
    """
    A class representing the special G-Code instructions used in 2D plotter art.

    Attributes
    plotter_type : PlotterType
      The plotting device that was selected during Plotter setup. Certain instructions are
      dependent upon the plotting device.
    """

    def __init__(
        self, plotter_type: PlotterTypeEnum, instruction: SpecialInstructionEnum
    ):
        self.plotter_type = plotter_type
        self.instruction = instruction

    @property
    def navigation_mode(self) -> Union[str, None]:
        """
        Separate the drawing instrument from the drawing surface.
        """
        if self.plotter_type == PlotterTypeEnum.plotter_2d:
            return "M3 S0"
        elif self.plotter_type == PlotterTypeEnum.plotter_3d:
            raise ValueError("3D Printer support coming soon")
        else:
            raise ValueError("Invalid plotter type")

    @property
    def drawing_mode(self) -> Union[str, None]:
        """
        Connect the drawing instrument with the drawing surface.
        """
        if self.plotter_type == PlotterTypeEnum.plotter_2d:
            return "M3 S1000"
        elif self.plotter_type == PlotterTypeEnum.plotter_3d:
            raise ValueError("3D Printer support coming soon")
        else:
            raise ValueError("Invalid plotter type")

    @property
    def pause(self) -> str:
        """
        Perform a brief pause. Useful, to reduce and prevent vibration.
        """
        return "G4 P0.25"

    @property
    def program_end(self) -> str:
        """
        Instruct the plotting device that plotting has concluded.
        """
        return "M2"

    @property
    def units_mm(self) -> str:
        """
        Set the units of the plotting device to mm.
        """
        return "G21"

    @property
    def units_inches(self) -> str:
        """
        Set the units of the plotting device to inches.
        """
        return "G20"

    def to_g_code(self) -> Union[str, None]:
        """
        Convert instruction to G-Code.

        Returns:
          string
            A special instruction in G-Code format.
        """
        if self.instruction == SpecialInstructionEnum.navigation_mode:
            return self.navigation_mode
        elif self.instruction == SpecialInstructionEnum.drawing_mode:
            return self.drawing_mode
        elif self.instruction == SpecialInstructionEnum.pause:
            return self.pause
        elif self.instruction == SpecialInstructionEnum.program_end:
            return self.program_end
        elif self.instruction == SpecialInstructionEnum.units_mm:
            return self.units_mm
        elif self.instruction == SpecialInstructionEnum.units_inches:
            return self.units_inches
        else:
            raise ValueError("Invalid special instruction")


class Layer:
    def __init__(
        self,
        x_min: float,
        y_min: float,
        x_max: float,
        y_max: float,
        units: UnitsEnum,
        feed_rate: float,
        plotter_type: PlotterTypeEnum,
        handle_out_of_bounds: HandleOutOfBoundsEnum,
        preview_only: bool = False,
    ):
        # Todo - Better type refinement
        self.instructions: Dict[PlottingInstructionTypeEnum, list] = {
            PlottingInstructionTypeEnum.setup: [],
            PlottingInstructionTypeEnum.plotting: [],
            PlottingInstructionTypeEnum.teardown: [],
        }
        self.preview_only = preview_only

        # Todo - Better type refinement
        self.plotted_points: list = []

        self.plotter_type = plotter_type

        # For calculating if a point is out of the range of the plotter.
        self.plotter_x_min = x_min
        self.plotter_x_max = x_max
        self.plotter_y_min = y_min
        self.plotter_y_max = y_max

        # For drawing a bounding box before printing.
        self.border_x_min = x_max
        self.border_x_max = x_min
        self.border_y_min = y_max
        self.border_y_max = y_min

        self.feed_rate = feed_rate

        self.handle_out_of_bounds = handle_out_of_bounds

        self.add_comment(SETUP_INSTRUCTIONS_DISPLAY, PlottingInstructionTypeEnum.setup)
        self.add_comment(
            PLOTTING_INSTRUCTIONS_DISPLAY, PlottingInstructionTypeEnum.plotting
        )
        self.add_comment(
            TEARDOWN_INSTRUCTIONS_DISPLAY, PlottingInstructionTypeEnum.teardown
        )

        if units == UnitsEnum.mm:
            self.add_comment("Setting units to mm", PlottingInstructionTypeEnum.setup)
            self.add_special(
                SpecialInstructionEnum.units_mm, PlottingInstructionTypeEnum.setup
            )

        if units == UnitsEnum.inches:
            self.add_comment(
                "Setting units to inches", PlottingInstructionTypeEnum.setup
            )
            self.add_special(
                SpecialInstructionEnum.units_inches, PlottingInstructionTypeEnum.setup
            )

        self.set_feed_rate(feed_rate, PlottingInstructionTypeEnum.setup)

        self.is_print_head_lowered = False
        self.add_special(
            SpecialInstructionEnum.navigation_mode, PlottingInstructionTypeEnum.setup
        )

        self.add_special(
            SpecialInstructionEnum.program_end, PlottingInstructionTypeEnum.teardown
        )

    def _update_max_and_min(self, x: float, y: float) -> None:
        """
        Updates the current max and min values for the bounding box of the layer.
        """
        if x < self.border_x_min:
            self.border_x_min = x
        if x > self.border_x_max:
            self.border_x_max = x
        if y < self.border_y_min:
            self.border_y_min = y
        if y > self.border_y_max:
            self.border_y_max = y

    def get_min_and_max_points(self) -> Dict[str, float]:
        """
        Find the min and max plot points of the layer.

        Returns:
          {x_min: float, y_min: float, x_max: float, y_max: float}
            A dictionary containing the max and min plot points of the layer.
        """
        return {
            "x_min": self.border_x_min,
            "y_min": self.border_y_min,
            "x_max": self.border_x_max,
            "y_max": self.border_y_max,
        }

    def set_feed_rate(
        self,
        feed_rate: float,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Set the speed at which the print head moves.

        Args:
          feed_rate : float
            The feed rate to set.
          instruction_type : str
            The type of instruction to use.  Defaults to PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(f"Feed Rate: {feed_rate}", instruction_type)
        self.instructions[instruction_type].append(FeedRate(feed_rate))
        return self

    def set_mode_to_draw(
        self,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Lower the pen. Should be used when starting a path.

        Args:
          instruction_type : str
            The type of instruction to use.  Defaults to PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """
        self.add_special(SpecialInstructionEnum.drawing_mode, instruction_type)
        self.add_special(SpecialInstructionEnum.pause, instruction_type)
        self.is_print_head_lowered = True

        return self

    def set_mode_to_navigation(
        self,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Raise the pen. Should be used once drawing a path is complete before moving on to next path.

        Args:
          instruction_type : str
            The type of instruction to use.  Defaults to PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """

        self.add_special(SpecialInstructionEnum.navigation_mode, instruction_type)
        self.add_special(SpecialInstructionEnum.pause, instruction_type)
        self.is_print_head_lowered = False

        return self

    def add_point(
        self,
        x: float,
        y: float,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Add a point to the layer. Typically not used directly, instead use one of the other add methods.

        Args:
          x : float
            The x-coordinate of the point.
          y : float
            The y-coordinate of the point.
          instruction_type : str
            The type of instruction to use.  Defaults to PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """
        if (
            x > self.plotter_x_max
            or y > self.plotter_y_max
            or x < self.plotter_x_min
            or y < self.plotter_y_min
        ):
            if self.handle_out_of_bounds == HandleOutOfBoundsEnum.Warning:
                print("Failed to add point, outside dimensions of plotter", x, y)
                # Todo - Can this cause an error with pen up / pen down instructions?
                return self
            elif self.handle_out_of_bounds == HandleOutOfBoundsEnum.Error:
                raise ValueError(
                    "Failed to add point, outside dimensions of plotter", x, y
                )
            elif self.handle_out_of_bounds == HandleOutOfBoundsEnum.Silent:
                # Typically only used in testing to keep things quiet
                pass
            else:
                raise ValueError(
                    "Invalid value for handle_out_of_bounds received",
                    self.plotter.handle_out_of_bounds,
                )
        self.add_comment(f"Point: {x}, {y}", instruction_type)
        self._update_max_and_min(x, y)
        if self.is_print_head_lowered:
            self.plotted_points.append((x, y))

        point = Point(self.feed_rate, x, y)
        self.instructions[instruction_type].append(point)
        return self

    def add_line(
        self,
        x_start: float,
        y_start: float,
        x_end: float,
        y_end: float,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        points = [(x_start, y_start), (x_end, y_end)]
        self.add_comment(
            f"Line: {x_start}, {y_start}, {x_end}, {y_end}", instruction_type
        )
        self.add_path(points, instruction_type)
        return self

    def add_path(
        self,
        points: List[Tuple[float, float]],
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Add a path layer.

        Args:
          points : List[Tuple[float, float]
            An array of points to add
          instruction_type : str
            The type of instruction to use.  Defaults to PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(f"Path: {points}", instruction_type)
        for index, [x, y] in enumerate(points):
            self.add_point(x, y, instruction_type)
            if index == 0 and not self.preview_only:
                self.set_mode_to_draw()
        self.set_mode_to_navigation()
        return self

    def add_special(
        self,
        special_instruction: SpecialInstructionEnum,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Add a special instruction.

        Args:
          special_instruction : SpecialInstructionEnum
            See `SpecialInstructionEnum` for special instruction definitions
          instruction_type : str
            The type of instruction to use.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """

        self.add_comment(str(special_instruction), instruction_type)
        self.instructions[instruction_type].append(
            SpecialInstruction(self.plotter_type, special_instruction)
        )
        return self

    def add_comment(
        self, text: str, instruction_type: PlottingInstructionTypeEnum
    ) -> Self:
        """
        Add a comment to the layer.

        Args:
          text : str
            The text to add.
          instruction_type : str
            The type of instruction to use.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """

        lines = text.split("\n")
        for line in lines:
            self.instructions[instruction_type].append(Comment(line))

        return self

    def add_rectangle(
        self,
        x_start: float,
        y_start: float,
        x_end: float,
        y_end: float,
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Adds a rectangle to the layer.

        Args:
          x_start : float
            The x-coordinate of the starting point of the rectangle.
          y_start : float
            The y-coordinate of the starting point of the rectangle.
          x_end : float
            The x-coordinate of the ending point of the rectangle.
          y_end : float
            The y-coordinate of the ending point of the rectangle.
          instruction_type : str, optional
            The type of instruction to use. Defaults to PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
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
        instruction_type: PlottingInstructionTypeEnum = PlottingInstructionTypeEnum.plotting,
    ) -> Self:
        """
        Adds a circle to the layer.

        Args:
          x_center : float
            The x-coordinate of the center of the circle.
          y_center : float
            The y-coordinate of the center of the circle.
          radius : float
            The radius of the circle.
          num_points : int
            The number of points to use to approximate the circle. Default is 36.
          instruction_type : float
            The type of instruction to use. Default is PlottingInstructionTypeEnum.plotting.

        Returns:
          Layer
            The Layer object. Allows for chaining of add methods.
        """
        self.add_comment(
            f"Circle: {x_center}, {y_center}, {radius}, {num_points}", instruction_type
        )

        # Calculate angle step between points to approximate the circle
        angle_step = 360.0 / num_points

        self.add_special(SpecialInstructionEnum.navigation_mode, instruction_type)
        self.add_special(SpecialInstructionEnum.pause, instruction_type)

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
          string
            The path to the file where the layer instructions will be saved.
        """
        with open(file_path, "w") as file:
            file.write(
                "\n".join(
                    [
                        instruction.to_g_code()
                        for instruction in self.instructions[
                            PlottingInstructionTypeEnum.setup
                        ]
                    ]
                )
            )
            file.write(
                "\n".join(
                    [
                        instruction.to_g_code()
                        for instruction in self.instructions[
                            PlottingInstructionTypeEnum.plotting
                        ]
                    ]
                )
            )
            file.write(
                "\n".join(
                    [
                        instruction.to_g_code()
                        for instruction in self.instructions[
                            PlottingInstructionTypeEnum.teardown
                        ]
                    ]
                )
            )

    def get_plotting_data(self) -> Dict[str, List[str]]:
        """
        Get current plotting data

        Returns:
          {"setup": [], "plotting": [], "teardown": []}
            A dictionary containing the setup, plotting, and teardown instructions as an array of G-Code
            instruction strings.
        """
        return {
            PlottingInstructionTypeEnum.setup.value: [
                instruction.to_g_code()
                for instruction in self.instructions[PlottingInstructionTypeEnum.setup]
            ],
            PlottingInstructionTypeEnum.plotting.value: [
                instruction.to_g_code()
                for instruction in self.instructions[
                    PlottingInstructionTypeEnum.plotting
                ]
            ],
            PlottingInstructionTypeEnum.teardown.value: [
                instruction.to_g_code()
                for instruction in self.instructions[
                    PlottingInstructionTypeEnum.teardown
                ]
            ],
        }
