# test_layer.py

import os
import unittest
from gcode2dplotterart.Plotter import Plotter
import json


class TestSnapshot(unittest.TestCase):

  def testSnapshot(self):
    output_directory = "./snapshots"
    layer = "black"
    snapshot_path = os.path.join(output_directory, f"{layer}.gcode")
    
    plotter = Plotter(
      units="mm",
      x_min = 0,
      x_max = 100,
      y_min = 0,
      y_max = 100,
      feed_rate=10000,
      output_directory=output_directory, 
      include_border_layer=False, 
      include_preview_layer=False, 
      handle_out_of_bounds='Silent' 
    )

    plotter.add_layer(layer)
    plotter.layers[layer].add_circle(1,1, 10)
    plotter.layers[layer].add_rectangle(50,50,75,75)
    plotter.layers[layer].add_path([(10,10), (20,20), (30,30)])

    # Save snapshot to snapshots directory if it's first time seeing test. Otherwise, compare contents are the same.
    if not os.path.exists(output_directory):
      os.makedirs(output_directory)

    if not os.path.isfile(snapshot_path):
      old_snapshot = plotter.get_plotting_data()
      with open(snapshot_path, "w") as file:
        file.write(json.dumps(old_snapshot))
      
      print(f"Verify code for {layer} then commit, then run this test again.")
    else:
      with open(snapshot_path, 'r') as file:
        old_snapshot = file.read()
        new_snapshot = json.dumps(plotter.get_plotting_data())
        assert old_snapshot == new_snapshot, f"\nExpected: {old_snapshot}\nActual  : {new_snapshot}"
        

if __name__ == '__main__':
    unittest.main()