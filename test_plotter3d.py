# test_layer.py

import os
import unittest
from gcode2dplotterart.Plotter3D import Plotter3D
import json

INDENT = 4

skip_test_and_generate_snapshots = os.environ.get("GENERATE_SNAPSHOTS", "no")


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
            output_directory="./snapshots",
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

        os.makedirs(snapshot_directory, exist_ok=True)

        # Save snapshot to snapshots directory if it's first time seeing test. Otherwise, compare contents are the same.
        if not os.path.isfile(os.path.join(snapshot_file_path)):
            first_snapshot = plotter.get_plotting_data()
            with open(snapshot_file_path, "w") as file:
                file.write(json.dumps(first_snapshot, indent=INDENT))

            print(f"Verify code for {layer} then commit, then run this test again.")
        else:
            with open(snapshot_file_path, "r") as file:
                old_snapshot = file.read()
                new_snapshot = json.dumps(plotter.get_plotting_data(), indent=INDENT)

                if skip_test_and_generate_snapshots == "yes":
                    print(f"Generating snapshot for {layer}")
                    with open(snapshot_file_path, "w") as file:
                        file.write(new_snapshot)
                    return
                else:
                    assert (
                        old_snapshot == new_snapshot
                    ), f"\nExpected: {old_snapshot}\nActual  : {new_snapshot}"


if __name__ == "__main__":
    unittest.main()
