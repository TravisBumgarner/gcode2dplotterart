import os
import json
from typing import Union

from gcode2dplotterart import Plotter2D, Plotter3D

skip_test_and_generate_snapshots = os.environ.get("GENERATE_SNAPSHOTS", "no")


INDENT = 4


def run_test_and_snapshot(
    snapshot_directory: str,
    snapshot_file_path: str,
    plotter: Union[Plotter3D, Plotter2D],
) -> None:
    os.makedirs(snapshot_directory, exist_ok=True)

    # Save snapshot to snapshots directory if it's first time seeing test. Otherwise, compare contents are the same.
    if not os.path.isfile(os.path.join(snapshot_file_path)):
        first_snapshot = plotter.get_plotting_data()
        with open(snapshot_file_path, "w") as file:
            file.write(json.dumps(first_snapshot, indent=INDENT))

        print(f"Verify code for {plotter.title} then commit, then run this test again.")
    else:
        with open(snapshot_file_path, "r") as file:
            old_snapshot = file.read()
            new_snapshot = json.dumps(plotter.get_plotting_data(), indent=INDENT)

            if skip_test_and_generate_snapshots == "yes":
                print(f"Generating snapshot for {plotter.title}")
                with open(snapshot_file_path, "w") as file:
                    file.write(new_snapshot)
                return
            else:
                assert (
                    old_snapshot == new_snapshot
                ), f"\nExpected: {old_snapshot}\nActual  : {new_snapshot}"
