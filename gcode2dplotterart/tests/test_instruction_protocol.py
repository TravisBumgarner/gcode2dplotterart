import unittest

from gcode2dplotterart.instruction import (
    Instruction,
    InstructionPoint,
    InstructionPause,
    InstructionComment,
    InstructionFeedRate,
    Instruction3DPrinterNavigationHeight,
    Instruction3DPrinterPlottingHeight,
    Instruction2DPlotterNavigationHeight,
    Instruction2DPlotterPlottingHeight,
    InstructionProgramEnd,
    InstructionUnitsMM,
    InstructionHome,
)


class TestInstructionProtocol(unittest.TestCase):
    """Tests that all instruction classes implement the Instruction protocol."""

    def test_instruction_point_implements_protocol(self) -> None:
        instruction = InstructionPoint(feed_rate=1000, x=10.0, y=20.0)
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_pause_implements_protocol(self) -> None:
        instruction = InstructionPause(duration=0.5)
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_comment_implements_protocol(self) -> None:
        instruction = InstructionComment("Test comment")
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_feed_rate_implements_protocol(self) -> None:
        instruction = InstructionFeedRate(feed_rate=1000)
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_3d_printer_navigation_height_implements_protocol(self) -> None:
        instruction = Instruction3DPrinterNavigationHeight(z_navigating_height=5.0, feed_rate=1000)
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_3d_printer_plotting_height_implements_protocol(self) -> None:
        instruction = Instruction3DPrinterPlottingHeight(z_plotting_height=0.5, feed_rate=1000)
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_2d_plotter_navigation_height_implements_protocol(self) -> None:
        instruction = Instruction2DPlotterNavigationHeight()
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_2d_plotter_plotting_height_implements_protocol(self) -> None:
        instruction = Instruction2DPlotterPlottingHeight()
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_program_end_implements_protocol(self) -> None:
        instruction = InstructionProgramEnd()
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_units_mm_implements_protocol(self) -> None:
        instruction = InstructionUnitsMM()
        self.assertIsInstance(instruction, Instruction)

    def test_instruction_home_implements_protocol(self) -> None:
        instruction = InstructionHome()
        self.assertIsInstance(instruction, Instruction)


if __name__ == "__main__":
    unittest.main()
