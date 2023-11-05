import os
import shutil
# import matplotlib.pyplot as plt

from .Layer import Layer, HandleOutOfBounds

class Plotter:
    """
    A class for configuring and controlling a plotter.
    """
    x_min: int
    x_max: int
    y_min: int
    y_max: int
    feed_rate: int
    layers: dict[str, Layer]
    output_directory: str
    include_border_layer: bool
    include_preview_layer: bool
    handle_out_of_bounds: HandleOutOfBounds

    def __init__(self, units, x_min, x_max, y_min, y_max, feed_rate,handle_out_of_bounds, output_directory="./output", include_border_layer=True, include_preview_layer=True):
        """
        Initialize a new Plotter instance.

        Args:
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
        
        self.units = units
        if units not in ['mm', 'inches']:
            raise ValueError("Units must be mm or inches")  
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.feed_rate = feed_rate
        self.layers = {}
        # self.colors = {}
        self.output_directory=output_directory
        self.include_border_layer = include_border_layer
        self.include_preview_layer = include_preview_layer
        self.handle_out_of_bounds = HandleOutOfBounds[handle_out_of_bounds]

    def add_layer(self, name: str):
        self.layers[name] = Layer(self)
        # self.colors[name] = color

    def get_image_bounds(self):
      all_layers_mins_and_maxes = [layer.get_max_and_min() for layer in self.layers.values()]
      
      x_min_values = [t['x_min'] for t in all_layers_mins_and_maxes]
      x_max_values = [t['x_max'] for t in all_layers_mins_and_maxes]
      y_min_values = [t['y_min'] for t in all_layers_mins_and_maxes]
      y_max_values = [t['y_max'] for t in all_layers_mins_and_maxes]

      overall_x_min = min(x_min_values)
      overall_x_max = max(x_max_values)
      overall_y_min = min(y_min_values)
      overall_y_max = max(y_max_values)

      return [(overall_x_min, overall_x_max), (overall_y_min, overall_y_max)]


    def add_border_layer(self):
      """
      Creates a new layer titled border. The border layer outlines the print area, drawing a border.
      """

      [min_point, max_point] = self.get_image_bounds()
      
      border_layer = Layer(self, preview_only=False)
      border_layer.add_rectangle(min_point[0], min_point[1], max_point[0], max_point[1])
      
      self.add_layer('border')
      self.layers['border'] = border_layer

    def add_preview_layer(self):
      """
      Creates a new layer titled preview. The preview layer outlines the print area without drawing anything.
      """
      [min_point, max_point] = self.get_image_bounds()
      
      preview_layer = Layer(self, preview_only=True)
      preview_layer.add_rectangle(min_point[0], min_point[1], max_point[0], max_point[1])
      
      self.add_layer('preview')
      self.layers['preview'] = preview_layer

    # def get_plotted_points(self):
    #   points = {}
    #   for layer_name, layer in self.layers.items():
    #     points[layer_name] = layer.get_plotted_points()
    #   return points
    
    # def preview(self):
    #   points = self.get_plotted_points()
    #   plt.figure()

    #   # Iterate through the dictionary
    #   for layer, coordinates in points.items():
    #       # Separate x and y coordinates
    #       x_values, y_values = zip(*coordinates)
    #       # Plot the points with the specified color
    #       plt.scatter(x_values, y_values, c=self.colors[layer])

    #   # Add labels and legend
    #   plt.xlabel('X-axis')
    #   plt.ylabel('Y-axis')
    #   plt.legend()

    #   # Display the plot
    #   plt.show()

    @property
    def width(self):
      return self.x_max - self.x_min
    
    @property
    def height(self):
      return self.y_max - self.y_min

    def is_point_in_bounds(self, x,y):
      return x > self.x_min and x < self.x_max and y > self.y_min and y < self.y_max

    def save(self):
      """
      Save all the layers to the output directory defined by the `output_directory` Plotter param. Each layer will be saved as an individual file with the filename defined by `{layer_name}.gcode`.
      If include_border_layer or include_preview_layer are set to True, they will be saved as `border.gcode` and `preview.gcode` respectively. 
      """
      if os.path.exists(self.output_directory):
        shutil.rmtree(self.output_directory)
      os.makedirs(self.output_directory)

      if self.include_border_layer:
        # Creates a new layer titled border
        self.add_border_layer()
      
      if self.include_preview_layer:
        # Creates a new layer titled preview
        self.add_preview_layer()

      for name, layer in self.layers.items():
        layer.save(os.path.join(self.output_directory, f'{name}.gcode'))