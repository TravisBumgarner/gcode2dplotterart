from ..Plotter2D import Plotter2D
from ..Plotter3D import Plotter3D
from typing import Union, List, Tuple
import math

SCALE_FACTOR = 10
TEST_HEIGHT = 15
PADDING = 10


def draw_sine_wave(
    x_start: float, y_start: float, width: float, height: float
) -> List[Tuple[float, float]]:
    path = []
    for x_scaled in range(
        int(x_start * SCALE_FACTOR), int((x_start + width) * SCALE_FACTOR), 1
    ):
        x = x_scaled / SCALE_FACTOR
        y = height * math.sin(x) + y_start
        path.append((x, y))
    return path


def calibrate_feed_rate(
    plotter: Union[Plotter2D, Plotter3D], values_to_test: List[float]
) -> None:
    """Calibrate the feed rate of the plotter.

    Args:
        plotter: The plotter to calibrate.
        values_to_test: The Feed Rate values to test.
    """
    plotter.add_layer("calibrate_feed_rate", color="black", line_width=1)

    max_str_chars = max([len(str(value)) for value in values_to_test])
    max_str_chars_width = (
        max_str_chars * TEST_HEIGHT
    )  # Font width is half font height with added spacing

    x_start = plotter.x_min
    y_start = plotter.y_min + TEST_HEIGHT

    for value in values_to_test:
        plotter.layers["calibrate_feed_rate"].set_feed_rate(value).add_text(
            str(value),
            x_start=x_start,
            y_start=y_start,
            font_size=TEST_HEIGHT,
            char_spacing=3,
        )

        sine_wave = draw_sine_wave(
            x_start=x_start + max_str_chars_width,
            y_start=y_start,
            width=plotter.width - max_str_chars_width,
            height=TEST_HEIGHT / 3,
        )

        plotter.layers["calibrate_feed_rate"].add_rectangle(
            x_start=x_start + max_str_chars_width + 5,
            y_start=y_start + TEST_HEIGHT / 2,
            x_end=x_start + max_str_chars_width + 20,
            y_end=y_start + TEST_HEIGHT,
        )

        plotter.layers["calibrate_feed_rate"].add_path(sine_wave)

        y_start = y_start + TEST_HEIGHT + PADDING

    plotter.preview()
    plotter.save()
