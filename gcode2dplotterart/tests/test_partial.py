import os
import unittest

from ..Plotter2D import Plotter2D
from gcode2dplotterart.tests.utils_test import run_test_and_snapshot


class TestSnapshot(unittest.TestCase):
    def testSnapshot(self) -> None:
        layer = "black"

        plotter = Plotter2D(
            title="offset_test",
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

        WIDTH = int(abs(plotter.x_max - plotter.x_min))
        HEIGHT = int(abs(plotter.y_max - plotter.y_min))
        plotter.add_layer("black", "black", 1)

        GAP = 5

        for x in range(0, WIDTH + GAP, GAP):
            for y in range(0, HEIGHT + GAP, GAP):
                plotter.layers["black"].add_point(x, y)

        for x in [0, 100]:
            for y in [0, 100]:
                print(x, y)
                plotter.layers["black"].add_line(x, y, x + 100, y + 100)
                plotter.layers["black"].add_line(x, y + 100, x + 100, y)
                plotter.layers["black"].add_line(x, y, x, y + 100)
                plotter.layers["black"].add_line(x + 100, y, x + 100, y + 100)
                plotter.layers["black"].add_rectangle(x, y, x + 100, y + 100)

        run_test_and_snapshot(snapshot_directory, snapshot_file_path, plotter)


if __name__ == "__main__":
    unittest.main()
