import unittest

from ..config import LayerConfig, PlotterConfig


class TestLayerConfig(unittest.TestCase):
    """Tests for LayerConfig dataclass."""

    def test_create_with_required_params(self) -> None:
        """LayerConfig can be created with required parameters."""
        config = LayerConfig(
            plotter_x_min=0.0,
            plotter_x_max=100.0,
            plotter_y_min=0.0,
            plotter_y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Warning",
            line_width=2.0,
            include_comments=True,
        )
        self.assertEqual(config.plotter_x_min, 0.0)
        self.assertEqual(config.plotter_x_max, 100.0)
        self.assertEqual(config.plotter_y_min, 0.0)
        self.assertEqual(config.plotter_y_max, 100.0)
        self.assertEqual(config.feed_rate, 1000.0)
        self.assertEqual(config.handle_out_of_bounds, "Warning")
        self.assertEqual(config.line_width, 2.0)
        self.assertTrue(config.include_comments)

    def test_default_values(self) -> None:
        """LayerConfig has correct default values for optional params."""
        config = LayerConfig(
            plotter_x_min=0.0,
            plotter_x_max=100.0,
            plotter_y_min=0.0,
            plotter_y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Warning",
            line_width=2.0,
            include_comments=True,
        )
        self.assertIsNone(config.color)
        self.assertFalse(config.preview_only)

    def test_custom_optional_values(self) -> None:
        """LayerConfig accepts custom values for optional params."""
        config = LayerConfig(
            plotter_x_min=0.0,
            plotter_x_max=100.0,
            plotter_y_min=0.0,
            plotter_y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Error",
            line_width=3.0,
            include_comments=False,
            color="#FF0000",
            preview_only=True,
        )
        self.assertEqual(config.handle_out_of_bounds, "Error")
        self.assertEqual(config.color, "#FF0000")
        self.assertTrue(config.preview_only)
        self.assertFalse(config.include_comments)

    def test_plotter_width_property(self) -> None:
        """plotter_width property returns absolute difference of x_max - x_min."""
        config = LayerConfig(
            plotter_x_min=-50.0,
            plotter_x_max=50.0,
            plotter_y_min=0.0,
            plotter_y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Warning",
            line_width=2.0,
            include_comments=True,
        )
        self.assertEqual(config.plotter_width, 100.0)

    def test_plotter_width_with_negative_range(self) -> None:
        """plotter_width property handles reversed min/max correctly."""
        config = LayerConfig(
            plotter_x_min=100.0,
            plotter_x_max=0.0,
            plotter_y_min=0.0,
            plotter_y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Warning",
            line_width=2.0,
            include_comments=True,
        )
        self.assertEqual(config.plotter_width, 100.0)

    def test_plotter_height_property(self) -> None:
        """plotter_height property returns absolute difference of y_max - y_min."""
        config = LayerConfig(
            plotter_x_min=0.0,
            plotter_x_max=100.0,
            plotter_y_min=-25.0,
            plotter_y_max=75.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Warning",
            line_width=2.0,
            include_comments=True,
        )
        self.assertEqual(config.plotter_height, 100.0)

    def test_plotter_height_with_negative_range(self) -> None:
        """plotter_height property handles reversed min/max correctly."""
        config = LayerConfig(
            plotter_x_min=0.0,
            plotter_x_max=100.0,
            plotter_y_min=200.0,
            plotter_y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Warning",
            line_width=2.0,
            include_comments=True,
        )
        self.assertEqual(config.plotter_height, 100.0)


class TestPlotterConfig(unittest.TestCase):
    """Tests for PlotterConfig dataclass."""

    def test_create_with_required_params(self) -> None:
        """PlotterConfig can be created with just required parameters."""
        config = PlotterConfig(
            title="test",
            x_min=0.0,
            x_max=100.0,
            y_min=0.0,
            y_max=100.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.title, "test")
        self.assertEqual(config.x_min, 0.0)
        self.assertEqual(config.x_max, 100.0)
        self.assertEqual(config.y_min, 0.0)
        self.assertEqual(config.y_max, 100.0)
        self.assertEqual(config.feed_rate, 1000.0)

    def test_default_values(self) -> None:
        """PlotterConfig has correct default values for optional params."""
        config = PlotterConfig(
            title="test",
            x_min=0.0,
            x_max=100.0,
            y_min=0.0,
            y_max=100.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.handle_out_of_bounds, "Warning")
        self.assertEqual(config.output_directory, "./output")
        self.assertTrue(config.include_comments)
        self.assertTrue(config.return_home_before_plotting)

    def test_custom_optional_values(self) -> None:
        """PlotterConfig accepts custom values for optional params."""
        config = PlotterConfig(
            title="test",
            x_min=0.0,
            x_max=100.0,
            y_min=0.0,
            y_max=100.0,
            feed_rate=1000.0,
            handle_out_of_bounds="Error",
            output_directory="/custom/path",
            include_comments=False,
            return_home_before_plotting=False,
        )
        self.assertEqual(config.handle_out_of_bounds, "Error")
        self.assertEqual(config.output_directory, "/custom/path")
        self.assertFalse(config.include_comments)
        self.assertFalse(config.return_home_before_plotting)

    def test_width_property(self) -> None:
        """Width property returns absolute difference of x_max - x_min."""
        config = PlotterConfig(
            title="test",
            x_min=-50.0,
            x_max=50.0,
            y_min=0.0,
            y_max=100.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.width, 100.0)

    def test_width_with_negative_range(self) -> None:
        """Width property handles reversed min/max correctly."""
        config = PlotterConfig(
            title="test",
            x_min=100.0,
            x_max=0.0,
            y_min=0.0,
            y_max=100.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.width, 100.0)

    def test_height_property(self) -> None:
        """Height property returns absolute difference of y_max - y_min."""
        config = PlotterConfig(
            title="test",
            x_min=0.0,
            x_max=100.0,
            y_min=-25.0,
            y_max=75.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.height, 100.0)

    def test_height_with_negative_range(self) -> None:
        """Height property handles reversed min/max correctly."""
        config = PlotterConfig(
            title="test",
            x_min=0.0,
            x_max=100.0,
            y_min=200.0,
            y_max=100.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.height, 100.0)

    def test_negative_coordinates(self) -> None:
        """PlotterConfig stores negative coordinates correctly."""
        config = PlotterConfig(
            title="test",
            x_min=-100.0,
            x_max=-50.0,
            y_min=-100.0,
            y_max=-50.0,
            feed_rate=1000.0,
        )
        self.assertEqual(config.x_min, -100.0)
        self.assertEqual(config.x_max, -50.0)
        self.assertEqual(config.y_min, -100.0)
        self.assertEqual(config.y_max, -50.0)


if __name__ == "__main__":
    unittest.main()
