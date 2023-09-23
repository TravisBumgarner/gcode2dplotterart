from Instructions import Instructions

"""
Algorithms more heavily based in using a 2D array that started as an image and applying some kind of transform to it.
"""

def horizontal_lines_algorithm(plotter, output_filename, processed_image, output_colors, x_offset, y_offset):
    buckets = len(output_colors)
    instruction_sets = [Instructions(plotter, should_outline=i==0) for i in range(buckets)]
    
    # Ignore every other row when plotting. 
    PLOT_EVERY_NTH_ROW = 2

    # Y-Axis is upside down.
    INVERT = -1
    
    for y, row in enumerate(processed_image):
        y = INVERT * y

        if y % PLOT_EVERY_NTH_ROW == 0: 
            continue

        x_start = 0
        y_start = y
        x_end = None
        y_end = None
        
        value = processed_image[0][y]
        instruction_sets[int(value)].add_comment(f'row {y}')

        for x, pixel in enumerate(row):
            if pixel == value:
                continue
            
            x_end = x
            y_end = y

            instruction_sets[int(value)].add_line(
                x_offset + x_start,
                y_offset + y_start,
                x_offset + x_end,
                y_offset + y_end
            )

            x_start = x
            y_start = y

            value = pixel
        x_end = x
        y_end = y

        instruction_sets[int(value)].add_line(
            x_offset + x_start,
            y_offset + y_start,
            x_offset + x_end,
            y_offset + y_end
        )

    for i in range(buckets):
        instruction_sets[i].print_to_file(f'./output/{output_filename}_{i}_{output_colors[i]}.gcode')
