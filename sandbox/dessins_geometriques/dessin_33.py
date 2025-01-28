# https://editor.p5js.org/v3ga/sketches/NaPUeAHdY
# Status - Can't Plot

from gcode2dplotterart import Plotter3D
import math

# Plotter dimensions and settings
X_MIN = 0
X_MAX = 180
Y_MIN = 70
Y_MAX = 230
Z_PLOTTING_HEIGHT = 0
Z_NAVIGATION_HEIGHT = 4

# Initialize the plotter
plotter = Plotter3D(
    title="Joligones - Adjusted for Bounds",
    x_min=X_MIN,
    x_max=X_MAX,
    y_min=Y_MIN,
    y_max=Y_MAX,
    z_plotting_height=Z_PLOTTING_HEIGHT,
    z_navigation_height=Z_NAVIGATION_HEIGHT,
    feed_rate=10_000,  # Default feed rate
    output_directory="./output",
    handle_out_of_bounds="Warning",  # Warn if points are out of bounds
)

# Define a layer for the black pen
black_pen_layer = "black_pen_layer"
plotter.add_layer(black_pen_layer, color="black", line_width=1.0)

# Design parameters (adjusted for bounds)
NP = 100
PI = math.pi
K = 300  # Reduced iterations for tighter bounds
AN = 21 * PI / 60  # Slightly increased angle increment
RA = 0.990  # Faster radius decay
AA = 0  # Initial angle
RR = 0.30 * NP  # Reduced initial radius
X = (NP - RR) / 2
Y = (NP - RR) / 2

# Scaling factors
scale_x = (X_MAX - X_MIN) / NP
scale_y = (Y_MAX - Y_MIN) / NP

# Generate the scaled path
scaled_path = [(X_MIN + X * scale_x, Y_MIN + Y * scale_y)]

for _ in range(K):
    X += RR * math.cos(AA)
    Y += RR * math.sin(AA)
    scaled_path.append((
        X_MIN + X * scale_x,
        Y_MIN + 1.7 * Y * scale_y  # Scaling for the modified Y
    ))
    AA += AN
    RR *= RA

# Add the scaled path to the plotter
plotter.layers[black_pen_layer].add_path(scaled_path)

# Preview and save the plot
plotter.preview()
plotter.save()
