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
    title="Dessin Path Plotting",
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

# Parameters for the design
NP = 180
K1, N, K, H = 10, 10, 18, 7
R1, R, RR = NP * 0.0, NP * 0.5, 0.80
DX, DY, A1, AD = NP / 2, NP / 2, 0, 0

# Generate paths
for I1 in range(N):
    R2 = R1 * (RR**I1)
    R3 = R * (RR**I1)

    CX = DX + R2 * math.cos(2 * math.pi * I1 / K1 + A1)
    CY = DY + R2 * math.sin(2 * math.pi * I1 / K1 + A1)

    path = []
    for i in range(K):
        X = CX + R3 * math.cos(2 * i * H * math.pi / K + AD)
        Y = CY + R3 * math.sin(2 * i * H * math.pi / K + AD)
        path.append((X_MIN + X, Y_MIN + Y))

    path.append(path[0])
    plotter.layers[black_pen_layer].add_path(path)

plotter.preview()
plotter.save()
