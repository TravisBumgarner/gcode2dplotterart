import os
import shutil

from .Layer import Layer

class Plotter:
    x_min: int
    x_max: int
    y_min: int
    y_max: int
    feed_rate: int
    layers: dict
    output_dir: str

    def __init__(self, units, x_min, x_max, y_min, y_max, feed_rate, output_dir="./output"):
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

    def add_layer(self, name: str):
        self.layers[name] = Layer(self)
                                  
    def save(self):
      if os.path.exists(self.output_dir):
        shutil.rmtree(self.output_dir)
      os.makedirs(self.output_dir)
    
      for name, layer in self.layers.items():
        layer.save(os.path.join(self.output_dir, f'{name}.gcode'))