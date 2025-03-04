import os
import unittest

from ..Plotter3D import Plotter3D
from gcode2dplotterart.tests.utils_test import run_test_and_snapshot


class TestSnapshot(unittest.TestCase):
    def testSnapshot(self) -> None:
        layer = "black"

        X_MIN = 0
        X_MAX = 170
        Y_MIN = 70
        Y_MAX = 230
        WIDTH = X_MAX - X_MIN
        HEIGHT = Y_MAX - Y_MIN
        Z_PLOTTING_HEIGHT = 0
        Z_NAVIGATION_HEIGHT = 0.5

        plotter = Plotter3D(
            title="test_offsets",
            x_min=X_MIN,
            x_max=X_MAX,
            y_min=Y_MIN,
            y_max=Y_MAX,
            z_plotting_height=Z_PLOTTING_HEIGHT,
            z_navigation_height=Z_NAVIGATION_HEIGHT,
            feed_rate=10_000,
            output_directory="./output",
            handle_out_of_bounds="Warning",
        )
        snapshot_directory = os.path.join(plotter.output_directory, plotter.title)
        snapshot_file_path = os.path.join(snapshot_directory, f"{layer}.json")

        plotter.add_layer("black", "black", 1)

        plotter.layers["black"].add_line(0, 0, WIDTH, HEIGHT)
        plotter.layers["black"].add_line(0, HEIGHT, WIDTH, 0)
        plotter.layers["black"].add_rectangle(0, 0, WIDTH, HEIGHT)
        plotter.layers["black"].add_circle(
            WIDTH / 2,
            HEIGHT / 2,
            min(WIDTH, HEIGHT) / 2,
        )

        run_test_and_snapshot(snapshot_directory, snapshot_file_path, plotter)


if __name__ == "__main__":
    unittest.main()
