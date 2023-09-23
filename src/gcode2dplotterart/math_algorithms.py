"""
Algorithms more heavily based in plotting points, lines, curves, etc. with mathematical equations.
"""
from Instructions import Instructions
from Plotter import Plotter
from random import random, randint
from math import sin

"""
"""


def wander(plotter: Plotter, filename_prefix, output_colors, x_offset, y_offset):
    """
    Take in 4 colors, wander outward from the center. Each color will wander towards a different quadrant of the X and Y axis.
    """
    border_preview = Instructions(plotter, use_for_preview_only=True)
    border = Instructions(plotter, use_for_border_only=True)


    if len(output_colors) != 4:
        raise Exception('wander algorithm requires 4 colors')

    
    quadrants_polarity = [
        [1, 1],
        [-1, 1],
        [-1, -1],
        [1, -1],
    ]

    for i in range(len(output_colors)):
        instructions = Instructions(plotter)

        current_point_x = plotter.x_max / 2
        current_point_y = plotter.y_min / 2
        
        while True:
            previous_point_x = current_point_x
            previous_point_y = current_point_y

            # Pick whether to walk in the positive / negative direction. Prefer walking towards the quadrant limit.
            # For example, Quadrant I will prefer to walk in the positive X and positive Y direction.
            x_polarity = quadrants_polarity[i][0] if random() < 0.6 else -1 * quadrants_polarity[i][0]
            y_polarity = quadrants_polarity[i][1] if random() < 0.6 else -1 * quadrants_polarity[i][1]
            
            # Ensure Length of line is always hypotenuse.
            hypotenuse = 5 

            random_value = random()
            # if random_value = 0, x = 0, y = hypotenuse
            # if random_value = 1, x = hypotenuse, y = 0
            # and so on. 
            # Pretty crafty if I do say so myself.
            x_length = random_value * hypotenuse
            y_length = (hypotenuse ** 2 - x_length ** 2) ** 0.5

            current_point_x = x_length * x_polarity + previous_point_x
            current_point_y = y_length * y_polarity + previous_point_y

            # Keep walking until collision with the wall.
            if (
                current_point_x > plotter.x_max
                or current_point_x < plotter.x_min
                or current_point_y > plotter.y_max
                or current_point_y < plotter.y_min
            ):
                break
            
            instructions.add_line(previous_point_x, previous_point_y, current_point_x, current_point_y)
            border_preview.add_line(previous_point_x, previous_point_y, current_point_x, current_point_y)
            border.add_line(previous_point_x, previous_point_y, current_point_x, current_point_y)

        instructions.print_to_file(f'./output/{filename_prefix}_{i}_{output_colors[i]}.gcode')
    border_preview.print_to_file(f'./output/preview.gcode')
    border.print_to_file(f'./output/border.gcode')

def bunch_of_lines(plotter: Plotter, filename_prefix, output_colors, hypotenuse):
    """
    Take in a color. Plot a bunch of lines in a grid with a fixed length and a variable slope.
    """
    border_preview = Instructions(plotter, use_for_preview_only=True)
    border = Instructions(plotter, use_for_border_only=True)
    instruction_sets = [Instructions(plotter) for i in range(len(output_colors))]

    for x0 in range(plotter.x_min, plotter.x_max, 10):
        for y0 in range(plotter.y_min, plotter.y_max, 10):
                # Should experiment with the slope calculation.
                slope = sin((x0 ** 2 + y0 ** 2) / (plotter.x_max ** 2 + plotter.y_max ** 2))

                delta_x = hypotenuse * (1 / (1 + slope ** 2)) ** 0.5
                delta_y = delta_x * slope

                x1 = x0 - delta_x
                y1 = y0 - delta_y

                x2 = x0 + delta_x
                y2 = y0 + delta_y

                try:
                    rand = randint(0, len(output_colors))
                    if rand == len(output_colors):
                        # Every so often don't plot a line. For Art.
                        continue

                    instruction_sets[rand].add_line(x1, y1, x2, y2)
                    border_preview.add_line(x1, y1, x2, y2)
                    border.add_line(x1, y1, x2, y2)
                except:
                    print('skipping point centered on', x0, y0)
                    continue
    
    for i in range(len(output_colors)):
        instruction_sets[i].print_to_file(f'./output/{filename_prefix}_{i}_{output_colors[i]}.gcode')

    border_preview.print_to_file(f'./output/preview.gcode')
    border.print_to_file(f'./output/border.gcode')



        


