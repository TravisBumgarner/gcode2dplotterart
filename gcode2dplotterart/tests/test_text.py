# test_layer.py

import os
import unittest
from ..Plotter2D import Plotter2D
from gcode2dplotterart.tests.utils_test import run_test_and_snapshot


class TestSnapshot(unittest.TestCase):
    def testSnapshot(self) -> None:
        layer = "black"

        plotter = Plotter2D(
            title="text_test",
            x_min=-100,
            x_max=100,
            y_min=-100,
            y_max=100,
            feed_rate=10000,
            output_directory="./gcode2dplotterart/tests/snapshots",
            handle_out_of_bounds="Warning",
        )
        snapshot_directory = os.path.join(plotter.output_directory, plotter.title)
        snapshot_file_path = os.path.join(snapshot_directory, f"{layer}.json")

        plotter.add_layer(layer)

        plotter.layers[layer].add_text("Hello World", 0, 0, 10, 10, 0)

        run_test_and_snapshot(snapshot_directory, snapshot_file_path, plotter)


if __name__ == "__main__":
    unittest.main()
