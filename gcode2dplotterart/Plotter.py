import os
import shutil

from .Layer import Layer

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

    def __init__(self, units, x_min, x_max, y_min, y_max, feed_rate, output_dir="./output", include_border_layer=True, include_preview_layer=True):
        self.units = units
        if units not in ['mm', 'inches']:
            raise ValueError("Units must be mm or inches")  
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.feed_rate = feed_rate
        self.layers = {}
        self.output_dir=output_dir
        self.include_border_layer = include_border_layer
        self.include_preview_layer = include_preview_layer

    def add_layer(self, name: str):
        self.layers[name] = Layer(self)

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