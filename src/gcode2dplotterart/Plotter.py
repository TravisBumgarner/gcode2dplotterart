class Plotter:
    x_min: int
    x_max: int
    y_min: int
    y_max: int
    feed_rate: int

    def __init__(self, units, x_min, x_max, y_min, y_max, feed_rate):
        self.units = units
        if units not in ['mm', 'inches']:
            raise ValueError("Units must be mm or inches")  
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max
        self.feed_rate = feed_rate