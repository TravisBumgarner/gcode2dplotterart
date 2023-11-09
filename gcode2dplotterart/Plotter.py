import os
import shutil
from enum import Enum


from .Layer import Layer
from .enums import PlotterTypeEnum, HandleOutOfBoundsEnum, UnitsEnum

class Plotter:
    plotter_type: PlotterTypeEnum
    title: str
    x_min: int
    x_max: int
    y_min: int
    y_max: int
    feed_rate: int
    layers: dict[str, Layer]
    output_directory: str
    include_border_layer: bool
    include_preview_layer: bool
    handle_out_of_bounds: HandleOutOfBoundsEnum

    def __init__(
        self,
        title: str,
        plotter_type: PlotterTypeEnum,
        units: UnitsEnum,
        x_min: int,
        x_max: int,
        y_min: int,
        y_max: int,
        feed_rate: int,
        handle_out_of_bounds: HandleOutOfBoundsEnum,
        output_directory: str ="./output",
        include_border_layer: bool =True,
        include_preview_layer: bool=True
      ):
      """
      Description:
      -----------
      Initialize a new Plotter instance.

      Args:
      -----------
          plotter_type (PlotterTypeEnum): The type of plotter. Currently only supports plotter_2d.
          title (str): The title of the work of art
          x_min (int): The minimum X-coordinate of the plotter.
          x_max (int): The maximum X-coordinate of the plotter.
          y_min (int): The minimum Y-coordinate of the plotter.
          y_max (int): The maximum Y-coordinate of the plotter.
          feed_rate (int): The feed rate for the plotter.
          layers (dict[str, Layer]): A dictionary of plot layers.
          output_directory (str): The directory where G-code files will be saved.
          include_border_layer (bool): Whether to include a border layer, outlines the print area, drawing a border.
          include_preview_layer (bool): Whether to include a preview layer, outlines the print area without drawing anything.
          handle_out_of_bounds (HandleOutOfBounds): How to handle out-of-bounds points. "Warning" will print a warning, skip the point, continue, "Error" will throw an error and stop.
      """
    
      self.plotter_type = plotter_type
      self.title = title
      self.units = units
      if units not in ['mm', 'inches']:
          raise ValueError("Units must be mm or inches")  
      self.x_min = x_min
      self.x_max = x_max
      self.y_min = y_min
      self.y_max = y_max
      self.feed_rate = feed_rate
      self.layers = {}
      self.output_directory=output_directory
      self.include_border_layer = include_border_layer
      self.include_preview_layer = include_preview_layer
      self.handle_out_of_bounds = HandleOutOfBoundsEnum[handle_out_of_bounds]

    def add_layer(self, title: str):
        """
        Add a new layer to the plotter with the given 

        Args:
        -----------
          title : str
            The title of the layer. Used when saving a layer to G-Code.
        """
        self.layers[title] = Layer(self)

    def get_min_and_max_points(self):
      """
      Description:
      -----------
      Find the min and max plot points of the plotter.

      Returns
      -----------
        {x_min: float, y_min: float, x_max: float, y_max: float}
          A dictionary containing the min and max plot points of the plotter.
      """
      all_layers_mins_and_maxes = [layer.get_min_and_max_points() for layer in self.layers.values()]
      
      x_min_values = [t['x_min'] for t in all_layers_mins_and_maxes]
      x_max_values = [t['x_max'] for t in all_layers_mins_and_maxes]
      y_min_values = [t['y_min'] for t in all_layers_mins_and_maxes]
      y_max_values = [t['y_max'] for t in all_layers_mins_and_maxes]

      overall_x_min = min(x_min_values)
      overall_x_max = max(x_max_values)
      overall_y_min = min(y_min_values)
      overall_y_max = max(y_max_values)

      value = {"x_min": overall_x_min, "y_min": overall_y_min, "x_max": overall_x_max, "y_max": overall_y_max}
      return value


    def add_border_layer(self):
      """
      Description:
      -----------
      Creates a new layer titled border. The border layer outlines the print area, drawing a border.
      """

      points = self.get_min_and_max_points()
      
      border_layer = Layer(self, preview_only=False)
      border_layer.add_rectangle(points['x_min'], points['y_min'], points['x_max'], points['y_max'])
      
      self.add_layer('border')
      self.layers['border'] = border_layer

    def add_preview_layer(self):
      """
      Description:
      -----------
      Creates a new layer titled preview. The preview layer outlines the print area and draws an X through the middle without drawing anything. Useful for checking the the drawing surface is flat.
      """
      points = self.get_min_and_max_points()
      
      preview_layer = Layer(self, preview_only=True)
      preview_layer.add_rectangle(points['x_min'], points['y_min'], points['x_max'], points['y_max'])
      preview_layer.add_line(points['x_min'], points['y_min'], points['x_max'], points['y_max'])
      preview_layer.add_line(points['x_min'], points['y_max'], points['x_max'], points['y_min'])
      
      self.add_layer('preview')
      self.layers['preview'] = preview_layer

    @property
    def width(self):
      """
      Description:
      -----------
      Width of the plotting area
      """
      return self.x_max - self.x_min
    
    @property
    def height(self):
      """
      Description:
      -----------
      Height of the plotting area
      """
      return self.y_max - self.y_min

    def is_point_in_bounds(self, x,y):
      """
      Description:
      -----------
      Whether the point to be potted is within the plotter bounds

      Args:
      -----------
        x : float
          The x-coordinate of the point to be plotted
        y : float
          The y-coordinate of the point to be plotted
      
      Returns
      -----------
        boolean
          Whether the point to be plotted is within the plotter bounds
      """
      return x > self.x_min and x < self.x_max and y > self.y_min and y < self.y_max
    
    def get_plotting_data(self):
      """
      Description:
      -----------
      
      """
      if self.include_border_layer:
        # Creates a new layer titled border
        self.add_border_layer()
      
      if self.include_preview_layer:
        # Creates a new layer titled preview
        self.add_preview_layer()
 
      output = {}
      for title, layer in self.layers.items():
        output[title] = layer.get_plotting_data()
      return output

    def save(self, clear_output_before_save=True):
      """
      Description:
      -----------
      Save all the layers to the output directory defined by the `output_directory` Plotter param. Each layer will be saved as an individual file with the filename defined by `{layer_name}.gcode`.
      If include_border_layer or include_preview_layer are set to True, they will be saved as `border.gcode` and `preview.gcode` respectively. 

      Arg:
        clear_output_before_save : boolean
          Whether to remove all files from the artwork output directory (defined as [output_directory]/[title]) before saving, defaults to True.
      """
      artwork_directory = os.path.join(self.output_directory, self.title)
      if clear_output_before_save and os.path.exists(artwork_directory):
        shutil.rmtree(artwork_directory)
      if not os.path.exists(artwork_directory):
        os.makedirs(artwork_directory)

      if self.include_border_layer:
        # Creates a new layer titled border
        self.add_border_layer()
      
      if self.include_preview_layer:
        # Creates a new layer titled preview
        self.add_preview_layer()

      for title, layer in self.layers.items():
        layer.save(os.path.join(self.output_directory, self.title, f'{title}.gcode'))