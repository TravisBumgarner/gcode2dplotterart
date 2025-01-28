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
    title="Curves - Dessin 84",
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

# Design parameters for Dessin 84
NP = 480
PI = math.pi

# Hardcoded DESSIN 84 parameters
N = 3000
T1 = 1
T2 = 150
K1 = 1
K2 = 1
R1 = NP * 0.18  # Adjusted for fit

# Generate the path
path = []

# Start the initial point
X0 = NP * 0.5
Y0 = NP * 0.5

# Start the loop for drawing the curves
for I in range(N):
    R2 = NP * 0.2 * (0.5 + 0.5 * math.cos(I * PI / N))  # Adjusted R2
    A1 = 2 * PI * I / N * T1
    A2 = 2 * PI * I / N * T2
    X = int(X0 + R1 * math.cos(K1 * A1) + R2 * math.cos(A2))
    Y = int(1.3 * (Y0 + R1 * math.sin(K2 * A1) + R2 * math.sin(A2)))  # Adjusted Y scaling
    
    if I == 0:
        path.append((X_MIN + X, Y_MIN + Y))  # Initial move
    else:
        path.append((X_MIN + X, Y_MIN + Y))  # Draw point

# Add the path to the plotter
plotter.layers[black_pen_layer].add_path(path)

# Preview and save the plot
plotter.preview()
plotter.save()
