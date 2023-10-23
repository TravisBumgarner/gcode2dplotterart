from enum import Enum
from typing import List, Tuple

import math

class HandleOutOfBounds(Enum):
  Warning = "Warning"
  Error = "Error"
  

class Point:
  def __init__(self, feed_rate: float, x: float | None = None, y: float | None = None):
    self.x = x
    self.y = y
    self.feed_rate = feed_rate

    if(x is None or y is None):
      raise ValueError("Point requires an X or Y")
          
  def __str__(self):
    output = "G1 "
    if(self.x is not None):
      output += f"X{self.x:.3f} "
    if(self.y is not None):
      output += f"Y{self.y:.3f} "
    output += f"F{self.feed_rate}"
    return output


class SpecialInstruction(Enum):
  PEN_UP = "M3 S0"
  PAUSE = "G04 P0.25" # Might need to refine this number
  PEN_DOWN = "M3 S1000"
  PROGRAM_END = "M2"


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

    for i in range(3):
      self.add_comment('Setup Instructions', 'setup')
      self.add_comment('Plotting Instructions', 'plotting')
      self.add_comment('Teardown Instructions', 'teardown')

    if self.plotter.units == 'mm':
      self.add_comment('Setting units to mm', 'setup')
      self.instructions['setup'].append('G21')
    if self.plotter.units == 'inches':
      self.add_comment('Setting units to inches', 'setup')
      self.instructions['setup'].append('G20')

    self.set_feed_rate(self.plotter.feed_rate, 'setup')
    
    self.is_print_head_lowered = False
    self.add_special(SpecialInstruction.PEN_UP, 'setup')

    self.instructions['teardown'].append(SpecialInstruction.PROGRAM_END.value)

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

    self.instructions[instruction_type].append(f"F{feed_rate}")
    return self

  def lower_print_head(self, instruction_type='plotting'):
    """Lower the pen. Should be used when starting a path."""
    self.add_special(SpecialInstruction.PEN_DOWN, instruction_type)
    self.add_special(SpecialInstruction.PAUSE, instruction_type)
    self.is_print_head_lowered = True

    return self

  def raise_print_head(self, instruction_type='plotting'):
    """Raise the pen. Should be used once drawing a path is complete before moving on to next path."""
    self.add_special(SpecialInstruction.PEN_UP, instruction_type)
    self.add_special(SpecialInstruction.PAUSE, instruction_type)
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
      if(self.plotter.handle_out_of_bounds == HandleOutOfBounds.Warning):
        print("Failed to add point, outside dimensions of plotter", x, y)
      elif(self.plotter.handle_out_of_bounds == HandleOutOfBounds.Error):
        raise ValueError("Failed to add point, outside dimensions of plotter", x, y)
      else:
        raise ValueError("Invalid value for handle_out_of_bounds received", self.plotter.handle_out_of_bounds)
    self.add_comment(f"Point: {x}, {y}", instruction_type)
    self.update_max_and_min(x, y)
    if self.is_print_head_lowered:
      self.plotted_points.append((x, y))

    point = Point(self.plotter.feed_rate, x, y)
    self.instructions[instruction_type].append(point)
    return self
  
  def add_line(self, x1, y1, x2, y2, instruction_type='plotting'):
    points = [
      tuple(x1, y1),
      tuple(x2, y2)
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

  def add_special(self, special_instruction: SpecialInstruction, instruction_type='plotting'):
    self.add_comment(special_instruction, instruction_type)

    self.instructions[instruction_type].append(special_instruction.value)
    return self
      
  def add_comment(self, comment: str, instruction_type):
    self.instructions[instruction_type].append(f";{comment}")
    return self

  def add_rectangle(self, x_min, y_min, x_max, y_max, instruction_type='plotting'):
    self.add_comment(f"Rectangle: {x_min}, {y_min}, {x_max}, {y_max}", instruction_type)
    points = [
      (x_min, y_min),
      (x_min, y_max),
      (x_max, y_max),
      (x_max, y_min),
      (x_min, y_min),
    ]
    self.add_path(points, instruction_type)
    return self

  def add_circle(self, x_center: float, y_center: float, radius: float, num_points=36, instruction_type='plotting'):
    self.add_comment(f"Circle: {x_center}, {y_center}, {radius}, {num_points}", instruction_type)
    
    # Calculate angle step between points to approximate the circle
    angle_step = 360.0 / num_points

    self.add_special(SpecialInstruction.PEN_UP, instruction_type)
    self.add_special(SpecialInstruction.PAUSE, instruction_type)

    points: List[Tuple[float, float]] = []
    for point in range(num_points):
      angle = math.radians(point * angle_step)
      x = x_center + radius * math.cos(angle)
      y = y_center + radius * math.sin(angle)
      points.append((x, y))
    self.add_path(points, instruction_type)
    return self
      
  def save(self, file_path: str):
      with open(file_path, "w") as file:
          file.write("\n".join([str(instruction) for instruction in self.instructions['setup']]))
          file.write("\n")
          file.write("\n".join([str(instruction) for instruction in self.instructions['plotting']]))
          file.write("\n")
          file.write("\n".join([str(instruction) for instruction in self.instructions['teardown']]))


  def get_plotted_points(self):
      return self.plotted_points

