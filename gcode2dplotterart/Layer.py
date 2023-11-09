from typing import List, Tuple
import math

from .enums import HandleOutOfBoundsEnum, SpecialInstructionEnum, PlotterTypeEnum
  
SETUP_INSTRUCTIONS_DISPLAY = """######################################################################################################
##############################            SETUP INSTRUCTIONS            ##############################
######################################################################################################"""

PLOTTING_INSTRUCTIONS_DISPLAY = """######################################################################################################
##############################           PLOTTING INSTRUCTIONS          ##############################
######################################################################################################"""

TEARDOWN_INSTRUCTIONS_DISPLAY = """######################################################################################################
##############################           TEARDOWN INSTRUCTIONS          ##############################
######################################################################################################"""


class Point:
  """
  A class representing a point in 2D space with an optional feed rate.

  Attributes:
  -----------
  feed_rate : float
      The feed rate of the point.
  x : float, optional
      The x-coordinate of the point.
  y : float, optional
      The y-coordinate of the point.

  Raises:
  -------
  ValueError
      If x or y is not provided.
  """

  def __init__(self, feed_rate: float, x: float, y: float):
    self.x = x
    self.y = y
    self.feed_rate = feed_rate

    if(x is None or y is None):
      raise ValueError("Point requires an X or Y")
          
  def to_gcode(self):
    """
     Returns a string representation of the point in G-code format.
    """
    output = "G1 "
    if(self.x is not None):
      output += f"X{self.x:.3f} "
    if(self.y is not None):
      output += f"Y{self.y:.3f} "
    output += f"F{self.feed_rate}"
    return output
  
class Comment:
  """
  A class representing a comment in G-code.

  Attributes:
  -----------
  text : str
    The text of the comment.
  """

  def __init__(self, text: str):
    self.text = text
      
  def to_gcode(self):
    """
     Returns a string representation of the comment in G-code format.
    """
    return f'\n;{self.text}'

class FeedRate:
  """
  A class representing the feed rate in G-code.

  Attributes:
  -----------
  feed_rate : float
    The feed rate.
  """

  def __init__(self, feed_rate: float):
    self.feed_rate = feed_rate
      
  def to_gcode(self):
    """
     Returns a string representation of the feed rate in G-code format.
    """
    return f'\nF{self.feed_rate}'  

class SpecialInstruction:
  """
  A class representing the special G-code instructions used in 2D plotter art.

  Attributes:
  -----------
  plotter_type : PlotterType

  """

  def __init__(self, plotter_type: PlotterTypeEnum, instruction: SpecialInstructionEnum):
    self.plotter_type = plotter_type
    self.instruction = instruction

  @property
  def pen_up(self):
    """
    Separate the drawing instrument from the drawing surface. 
    """
    print('hmm', self.plotter_type, PlotterTypeEnum.plotter_2d)
    if self.plotter_type == PlotterTypeEnum.plotter_2d:
      return "M3 S0"
    elif self.plotter_type == PlotterTypeEnum.plotter_3d:
      pass
    else:
      raise ValueError("Invalid plotter type")
    
  @property
  def pen_down(self):
    """
    Connect the drawing instrument with the drawing surface.
    """
    print('hmm2', self.plotter_type)
    if self.plotter_type == PlotterTypeEnum.plotter_2d:
      return "M3 S1000"
    elif self.plotter_type == PlotterTypeEnum.plotter_3d:
      pass
    else: 
      raise ValueError("Invalid plotter type")
    
  @property
  def pause(self):
    """
    Perform a brief pause. Useful, to reduce and prevent vibration. 
    """
    return "G4 P0.25"
    
  @property
  def program_end(self):
    """
    Instruct the plotting device that plotting has concluded.
    """
    return "M2"
  
  @property
  def units_mm(self):
    """
    Set the units of the plotting device to mm.
    """
    return "G21"
  
  @property
  def units_inches(self):
    """
    Set the units of the plotting device to inches.
    """
    return "G20"
  
  def to_gcode(self):
    """
     Returns a string representation of the special instruction in G-code format.
    """
    if self.instruction == SpecialInstructionEnum.pen_up:
      return self.pen_up
    elif self.instruction == SpecialInstructionEnum.pen_down:
      return self.pen_down
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
  def __init__(self, plotter, preview_only=False):
    self.instructions = {
      "setup": [],
      "plotting": [],
      "teardown": []
    }
    self.preview_only = preview_only
    self.plotter = plotter

    self.plotted_points = []

    # For drawing a bounding box before printing.
    self.image_x_min = self.plotter.x_max
    self.image_x_max = self.plotter.x_min
    self.image_y_min = self.plotter.y_max
    self.image_y_max = self.plotter.y_min

    self.add_comment(SETUP_INSTRUCTIONS_DISPLAY, 'setup')
    self.add_comment(PLOTTING_INSTRUCTIONS_DISPLAY, 'plotting')
    self.add_comment(TEARDOWN_INSTRUCTIONS_DISPLAY, 'teardown')

    if self.plotter.units == 'mm':
      self.add_comment('Setting units to mm', 'setup')
      self.add_special(SpecialInstructionEnum.units_mm, 'setup')
    
    if self.plotter.units == 'inches':
      self.add_comment('Setting units to inches', 'setup')
      self.add_special(SpecialInstructionEnum.units_inches, 'setup')

    self.set_feed_rate(self.plotter.feed_rate, 'setup')
    
    self.is_print_head_lowered = False
    self.add_special(SpecialInstructionEnum.pen_up, 'setup')

    self.add_special(SpecialInstructionEnum.program_end, 'teardown')

  def update_max_and_min(self, x, y):
    if x < self.image_x_min:
      self.image_x_min = x
    if x > self.image_x_max:
      self.image_x_max = x
    if y < self.image_y_min:
      self.image_y_min = y
    if y > self.image_y_max:
      self.image_y_max = y

  def get_max_and_min(self) -> dict[str, float]:
    return {"x_min": self.image_x_min, "x_max": self.image_x_max, "y_min": self.image_y_min, "y_max": self.image_y_max}
  
  def set_feed_rate(self, feed_rate, instruction_type='plotting'):
    self.add_comment(f"Feed Rate: {feed_rate}", instruction_type)
    self.instructions[instruction_type].append(FeedRate(feed_rate))
    return self

  def lower_print_head(self, instruction_type='plotting'):
    """Lower the pen. Should be used when starting a path."""
    self.add_special(SpecialInstructionEnum.pen_down, instruction_type)
    self.add_special(SpecialInstructionEnum.pause, instruction_type)
    self.is_print_head_lowered = True

    return self

  def raise_print_head(self, instruction_type='plotting'):
    """Raise the pen. Should be used once drawing a path is complete before moving on to next path."""
    self.add_special(SpecialInstructionEnum.pen_up, instruction_type)
    self.add_special(SpecialInstructionEnum.pause, instruction_type)
    self.is_print_head_lowered = False

    return self

  def add_point(self, x, y, instruction_type="plotting"):
    """Add a point to the layer. If the print head is lowered, it will be plotted."""

    if (
      x > self.plotter.x_max
      or y > self.plotter.y_max
      or x < self.plotter.x_min
      or y < self.plotter.y_min
    ):
      if(self.plotter.handle_out_of_bounds == HandleOutOfBoundsEnum.Warning):
        print("Failed to add point, outside dimensions of plotter", x, y)
        # Todo - Can this cause an error with pen up / pen down instructions?
        return
      elif(self.plotter.handle_out_of_bounds == HandleOutOfBoundsEnum.Error):
        raise ValueError("Failed to add point, outside dimensions of plotter", x, y)
      elif(self.plotter.handle_out_of_bounds == HandleOutOfBoundsEnum.Silent):
        # Typically only used in testing to keep things quiet
        pass
      else:
        raise ValueError("Invalid value for handle_out_of_bounds received", self.plotter.handle_out_of_bounds)
    self.add_comment(f"Point: {x}, {y}", instruction_type)
    self.update_max_and_min(x, y)
    if self.is_print_head_lowered:
      self.plotted_points.append((x, y))

    point = Point(self.plotter.feed_rate, x, y)
    self.instructions[instruction_type].append(point)
    return self
  
  def add_line(self, x_start: float, y_start: float, x_end: float, y_end: float, instruction_type='plotting'):
    points = [
      (x_start, y_start),
      (x_end, y_end)
    ]
    self.add_path(points, instruction_type)
    return self

  def add_path(self, points: List[Tuple[float, float]], instruction_type="plotting"):
    self.add_comment(f"Path: {points}", instruction_type)

    for index, [x,y] in enumerate(points):
      self.add_point(x, y, instruction_type)
      if index == 0 and not self.preview_only:
          self.lower_print_head()
    self.raise_print_head()
    return self
  
  def add_special(self, special_instruction: SpecialInstructionEnum, instruction_type='plotting'):
    self.add_comment(str(special_instruction), instruction_type)
    print(self.plotter.plotter_type)
    self.instructions[instruction_type].append(SpecialInstruction(self.plotter.plotter_type, special_instruction))
    return self
      
  def add_comment(self, comment: str, instruction_type):
    lines = comment.split("\n")
    for line in lines:
      self.instructions[instruction_type].append(Comment(line))
    
    return self

  def add_rectangle(self, x_start: float, y_start: float, x_end: float, y_end: float, instruction_type='plotting'):
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
        The type of instruction to use. Defaults to 'plotting'.

    Returns:
      Layer: The Layer object.
    """
    self.add_comment(f"Rectangle: {x_start}, {y_start}, {x_end}, {y_end}", instruction_type)
    points = [
      (x_start, y_start),
      (x_start, y_end),
      (x_end, y_end),
      (x_end, y_start),
      (x_start, y_start),
    ]
    self.add_path(points, instruction_type)
    return self

  def add_circle(self, x_center: float, y_center: float, radius: float, num_points=36, instruction_type='plotting'):
    """
    Adds a circle to the layer.

    Args:
      x_center : float
        The x-coordinate of the center of the circle.
      y_center : float
        The y-coordinate of the center of the circle.
      radius : float
        The radius of the circle.
      num_points : float
        The number of points to use to approximate the circle. Default is 36.
      instruction_type : float
        The type of instruction to use. Default is 'plotting'.
    
    Returns:
      Layer: The Layer object.
    """
    self.add_comment(f"Circle: {x_center}, {y_center}, {radius}, {num_points}", instruction_type)
    
    # Calculate angle step between points to approximate the circle
    angle_step = 360.0 / num_points

    self.add_special(SpecialInstructionEnum.pen_up, instruction_type)
    self.add_special(SpecialInstructionEnum.pause, instruction_type)

    points: List[Tuple[float, float]] = []
    for point in range(num_points):
      angle = math.radians(point * angle_step)
      x = x_center + radius * math.cos(angle)
      y = y_center + radius * math.sin(angle)
      points.append((x, y))
    self.add_path(points, instruction_type)
    return self
      
  def save(self, file_path: str):
    """
    Saves the layer instructions to a file at the specified file path.
    
    Args:
      file_path : string
        The path to the file where the layer instructions will be saved.
    """
    with open(file_path, "w") as file:
      file.write("\n".join([instruction.to_gcode() for instruction in self.instructions['setup']]))
      # file.write("\n")
      # file.write("\n".join([instruction.to_gcode() for instruction in self.instructions['plotting']]))
      # file.write("\n")
      # file.write("\n".join([instruction.to_gcode() for instruction in self.instructions['teardown']]))

  def get_plotting_data(self):
      """
      Returns a dictionary containing the setup, plotting, and teardown instructions as an array of strings.
      
      Args:
        include_comments : boolean 
          A boolean indicating whether to include comments in the returned instructions.
      
      Returns:
        A dictionary containing the setup, plotting, and teardown instructions as an array of strings.
      """
      return {
        "setup": [instruction.to_gcode() for instruction in self.instructions['setup']],
        "plotting": [instruction.to_gcode() for instruction in self.instructions['plotting']],
        "teardown": [instruction.to_gcode() for instruction in self.instructions['teardown']]
      }


