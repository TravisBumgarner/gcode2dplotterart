import os
import shutil

from .Layer import Layer

class Plotter:
    _x_min: int
    _x_max: int
    _y_min: int
    _y_max: int
    _feed_rate: int
    _layers: dict[str, Layer]
    _output_dir: str
    _include_border_layer: bool
    _include_preview_layer: bool

    def __init__(self, units, x_min, x_max, y_min, y_max, feed_rate, output_dir="./output", include_border_layer=True, include_preview_layer=True):
        self.units = units
        if units not in ['mm', 'inches']:
            raise ValueError("Units must be mm or inches")  
        self._x_min = x_min
        self._x_max = x_max
        self._y_min = y_min
        self._y_max = y_max
        self._feed_rate = feed_rate
        self._layers = {}
        self._output_dir=output_dir
        self._include_border_layer = include_border_layer
        self._include_preview_layer = include_preview_layer

    def add_layer(self, name: str):
        self._layers[name] = Layer(self)

    def update_layer(self, name: str) -> Layer:
        return self._layers[name]

    def draw_border(self, as_preview):
      bounds = [layer.get_max_and_min() for layer in self._layers.values()]
      
      x_min_values = [t['x_min'] for t in bounds]
      x_max_values = [t['x_max'] for t in bounds]
      y_min_values = [t['y_min'] for t in bounds]
      y_max_values = [t['y_max'] for t in bounds]

      overall_x_min = min(x_min_values)
      overall_x_max = max(x_max_values)
      overall_y_min = min(y_min_values)
      overall_y_max = max(y_max_values)

      border_layer = Layer(self, preview_only=as_preview)
      border_layer.add_line(overall_x_min, overall_y_min, overall_x_max, overall_y_min)
      border_layer.add_line(overall_x_max, overall_y_min, overall_x_max, overall_y_max)
      border_layer.add_line(overall_x_max, overall_y_max, overall_x_min, overall_y_max)
      border_layer.add_line(overall_x_min, overall_y_max, overall_x_min, overall_y_min)

      self._layers['preview' if as_preview else 'border'] = border_layer


    def save(self):
      if os.path.exists(self._output_dir):
        shutil.rmtree(self._output_dir)
      os.makedirs(self._output_dir)

      if self._include_border_layer:
        self.draw_border(as_preview=False)
      
      if self._include_preview_layer:
        self.draw_border(as_preview=True)

      for name, layer in self._layers.items():
        layer.save(os.path.join(self._output_dir, f'{name}.gcode'))