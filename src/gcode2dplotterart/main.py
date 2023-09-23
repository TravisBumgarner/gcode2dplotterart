from Image import Image
from utils import folder_setup
from Plotter import Plotter
import image_algorithms
import math_algorithms

def main_with_image(filename, output_colors, x_offset, y_offset):
    folder_setup()
    plotter = Plotter(units="mm", x_min = 0, x_max = 280, y_min = -200, y_max = 0, feed_rate=10000)

    image = Image(filename)
    image.prepare_for_bucket_algorithm(should_resize=False, should_rotate=True)
    image.apply_bucket_algorithm(method='bucket_pixels_evenly_by_output_colors', output_colors=output_colors)
    image_algorithms.horizontal_lines_algorithm(plotter, output_filename=filename, processed_image=image.image, output_colors=output_colors, x_offset=x_offset, y_offset=y_offset)

# main_with_image(
#     filename='test.png',
#     output_colors=[ 'red', 'gold', 'blue'],
#     x_offset=75,
#     y_offset=0,
# )


def main_with_math(output_colors, x_offset, y_offset):
    folder_setup()
    plotter = Plotter(units="mm", x_min = 0, x_max = 200, y_min = -160, y_max = 0, feed_rate=10000)
    math_algorithms.bunch_of_lines(plotter=plotter, filename_prefix='bunch_of_lines', output_colors=output_colors, hypotenuse=10)

main_with_math(
    output_colors=[ 'purple', 'blue', 'yellow'],
    x_offset=0,
    y_offset=0,

)

