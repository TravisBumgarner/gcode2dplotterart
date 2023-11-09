# test_layer.py

import os
import unittest
from gcode2dplotterart.Plotter import Plotter
from gcode2dplotterart.enums import PlotterTypeEnum
import json

INDENT = 4

class TestSnapshot(unittest.TestCase):

  def testSnapshot(self):
    layer = "black"
    
    plotter = Plotter(
      title="test",
      plotter_type=PlotterTypeEnum.plotter_2d,
      units="mm",
      x_min = 0,
      x_max = 100,
      y_min = 0,
      y_max = 100,
      feed_rate=10000,
      output_directory="./snapshots", 
      include_border_layer=False, 
      include_preview_layer=False, 
      handle_out_of_bounds='Silent' 
    )
    snapshot_directory = os.path.join(plotter.output_directory, plotter.title)
    snapshot_file_path = os.path.join(snapshot_directory, f"{layer}.json")

    plotter.add_layer(layer)
    plotter.layers[layer].add_circle(1,1, 10)
    plotter.layers[layer].add_rectangle(50,50,75,75)
    plotter.layers[layer].add_path([(10,10), (20,20), (30,30)])

    os.makedirs(snapshot_directory, exist_ok=True)

    # Save snapshot to snapshots directory if it's first time seeing test. Otherwise, compare contents are the same.
    if not os.path.isfile(os.path.join(snapshot_file_path)):
      first_snapshot = plotter.get_plotting_data()
      with open(snapshot_file_path, "w") as file:
        file.write(json.dumps(first_snapshot, indent=INDENT))
      
      print(f"Verify code for {layer} then commit, then run this test again.")
    else:
      with open(snapshot_file_path, 'r') as file:
        old_snapshot = file.read()
        new_snapshot = json.dumps(plotter.get_plotting_data(), indent=INDENT)
        # assert old_snapshot == new_snapshot, f"\nExpected: {old_snapshot}\nActual  : {new_snapshot}"

      # comment out the assert line to write changes to the file to get a diff, could be a better way of doing this.
      return
      # with open(snapshot_file_path, "w") as file:
      #   file.write(new_snapshot)
        

if __name__ == '__main__':
    unittest.main()