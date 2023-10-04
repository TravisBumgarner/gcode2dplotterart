import os
import shutil
import matplotlib.pyplot as plt

from .Layer import Layer, HandleOutOfBounds

class Plotter:
    x_min: int
    x_max: int
    y_min: int
    y_max: int
    feed_rate: int
    layers: dict[str, Layer]
    output_dir: str
    include_border_layer: bool
    include_preview_layer: bool
    handle_out_of_bounds: HandleOutOfBounds

    def __init__(self, units, x_min, x_max, y_min, y_max, feed_rate,handle_out_of_bounds, output_dir="./output", include_border_layer=True, include_preview_layer=True):
        self.units = units
        if units not in ['mm', 'inches']:
            raise ValueError("Units must be mm or inches")  
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.feed_rate = feed_rate
        self.layers = {}
        self.colors = {}
        self.output_dir=output_dir
        self.include_border_layer = include_border_layer
        self.include_preview_layer = include_preview_layer
        self.handle_out_of_bounds = HandleOutOfBounds[handle_out_of_bounds]

    def add_layer(self, name: str, color: str):
        self.layers[name] = Layer(self)
        self.colors[name] = color

    def draw_border(self, as_preview):
      bounds = [layer.get_max_and_min() for layer in self.layers.values()]
      
      x_min_values = [t['x_min'] for t in bounds]
      x_max_values = [t['x_max'] for t in bounds]
      y_min_values = [t['y_min'] for t in bounds]
      y_max_values = [t['y_max'] for t in bounds]

      overall_x_min = min(x_min_values)
      overall_x_max = max(x_max_values)
      overall_y_min = min(y_min_values)
      overall_y_max = max(y_max_values)

      border_layer = Layer(self, preview_only=as_preview)
      border_layer.add_rectangle(overall_x_min, overall_y_min, overall_x_max, overall_y_max)
      
      self.layers['preview' if as_preview else 'border'] = border_layer

    def get_plotted_points(self):
      points = {}
      for layer_name, layer in self.layers.items():
        points[layer_name] = layer.get_plotted_points()
      return points
    
    def preview(self):
      points = self.get_plotted_points()
      plt.figure()

      # Iterate through the dictionary
      for layer, coordinates in points.items():
          # Separate x and y coordinates
          x_values, y_values = zip(*coordinates)
          # Plot the points with the specified color
          plt.scatter(x_values, y_values, c=self.colors[layer])

      # Add labels and legend
      plt.xlabel('X-axis')
      plt.ylabel('Y-axis')
      plt.legend()

      # Display the plot
      plt.show()

    def save(self):
      if os.path.exists(self.output_dir):
        shutil.rmtree(self.output_dir)
      os.makedirs(self.output_dir)

      if self.include_border_layer:
        self.draw_border(as_preview=False)
      
      if self.include_preview_layer:
        self.draw_border(as_preview=True)

      for name, layer in self.layers.items():
        layer.save(os.path.join(self.output_dir, f'{name}.gcode'))