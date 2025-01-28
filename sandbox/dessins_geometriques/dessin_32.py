# https://editor.p5js.org/v3ga/sketches/BbxFzu_47

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
    title="Polygones Réguliers - Dessin 32",
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

# Design parameters for Dessin 32
NP = 140
PI = math.pi
K = 100  # Number of iterations
AN = 2 * PI / 5 + 0.01  # Angle increment
RA = 0.993  # Radius decay factor
RR = 0.6 * NP  # Initial radius
AA = 0  # Initial angle
X = (NP - RR) / 2
Y = (NP - RR) / 2

# Generate the path
path = []

for _ in range(K):
    X += RR * math.cos(AA)
    Y += RR * math.sin(AA)
    path.append((
        X_MIN + X,  # Unscaled X
        Y_MIN + Y   # Unscaled Y
    ))
    AA += AN
    RR *= RA

# Add the path to the plotter
plotter.layers[black_pen_layer].add_path(path)

# Preview and save the plot
plotter.preview()
plotter.save()
