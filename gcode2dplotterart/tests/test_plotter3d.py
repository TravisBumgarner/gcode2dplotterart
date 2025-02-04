import os
import unittest

from ..Plotter3D import Plotter3D
from gcode2dplotterart.tests.utils_test import run_test_and_snapshot


class TestSnapshot(unittest.TestCase):
    def testSnapshot(self) -> None:
        layer = "black"

        plotter = Plotter3D(
            title="plotter3d_test",
            x_min=-100,
            x_max=100,
            y_min=-100,
            y_max=100,
            feed_rate=20000,
            output_directory="./gcode2dplotterart/tests/snapshots",
            handle_out_of_bounds="Warning",
            z_plotting_height=0,
            z_navigation_height=10,
        )
        snapshot_directory = os.path.join(plotter.output_directory, plotter.title)
        snapshot_file_path = os.path.join(snapshot_directory, f"{layer}.json")

        plotter.add_layer(layer)

        plotter.layers[layer].add_point(30, 40).add_circle(1, 1, 10).add_rectangle(
            50, 50, 75, 75
        ).add_path([(10, 10), (20, 20), (30, 30)]).add_line(0, 15, 0, 15).add_comment(
            "Test comment", instruction_phase="teardown"
        )

        run_test_and_snapshot(snapshot_directory, snapshot_file_path, plotter)


if __name__ == "__main__":
    unittest.main()
