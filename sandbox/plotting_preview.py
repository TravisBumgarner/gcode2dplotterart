import matplotlib.pyplot as plt

# Sample data
x_values = [1, 2, 3, 4, 5]
y_values = [2, 4, 6, 8, 10]

# Connecting points with lines
plt.plot(x_values, y_values, color="#00FF00", linestyle="-", linewidth=20.0, solid_capstyle="round")

plt.gca().set_aspect("equal", adjustable="box")

plt.xlim(-10, 100)  # Set x-axis limits from 0 to 6
plt.ylim(-10, 100)  # Set y-axis limits from 0 to 12

# Adding a legend
plt.legend()

# Display the plot
plt.show()
