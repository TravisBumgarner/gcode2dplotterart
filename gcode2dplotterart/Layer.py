from enum import Enum
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
      self.instructions['setup'].append('G21')
    if self.plotter.units == 'inches':
      self.instructions['setup'].append('G20')

    self.instructions['setup'].append(f"F{self.plotter.feed_rate}")

    self.instructions['teardown'].append(SpecialInstruction.PROGRAM_END.value)

  
  def lower_print_head(self):
    """Lower the pen. Should be used when starting a segment."""
    self.add_special(SpecialInstruction.PEN_DOWN)
    self.add_special(SpecialInstruction.PAUSE)

  def raise_print_head(self):
    """Raise the pen. Should be used once printing a segment is complete before moving on to next segment."""
    self.add_special(SpecialInstruction.PEN_UP)
    self.add_special(SpecialInstruction.PAUSE)

  def add_line(self, x1, y1, x2, y2):
    self.add_point(x1, y1) 
    if not self.preview_only:
      self.lower_print_head()
    self.add_point(x2, y2)
    if not self.preview_only:
      self.raise_print_head()

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

  def add_point(self, x, y, type="plotting"):
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

    self.update_max_and_min(x,y)

    point = Point(self.plotter.feed_rate, x, y)
    self.instructions[type].append(point)

  def add_special(self, special_instruction: SpecialInstruction, type='plotting'):
    self.instructions[type].append(special_instruction.value)
      
  def add_comment(self, comment: str, type='plotting'):
    self.instructions[type].append(f";{comment}")

  def add_rectangle(self, x_min, y_min, x_max, y_max):
    self.add_line(x_min, y_max, x_min, y_min)
    self.add_line(x_min, y_min, x_max, y_min)
    self.add_line(x_max, y_min, x_max, y_max)
    self.add_line(x_max, y_max, x_min, y_max)

  def add_circle(self, x_center: float, y_center: float, radius: float, num_points=36):
    # Calculate angle step between points to approximate the circle
    angle_step = 360.0 / num_points

    self.add_special(SpecialInstruction.PEN_UP)
    self.add_special(SpecialInstruction.PAUSE)

    for index, point in enumerate(range(num_points)):
      angle = math.radians(point * angle_step)
      x = x_center + radius * math.cos(angle)
      y = y_center + radius * math.sin(angle)

      self.add_point(x, y)
      if index == 0:
          self.lower_print_head()

    self.raise_print_head()

      
  def save(self, file_path: str):
      with open(file_path, "w") as file:
          file.write("\n".join([str(instruction) for instruction in self.instructions['setup']]))
          file.write("\n")
          file.write("\n".join([str(instruction) for instruction in self.instructions['plotting']]))
          file.write("\n")
          file.write("\n".join([str(instruction) for instruction in self.instructions['teardown']]))

  def get(self):
      return self.plotting_instructions

