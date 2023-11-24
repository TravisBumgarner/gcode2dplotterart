from abc import ABC


class _AbstractSimpleInstruction(
    ABC,
):
    """Abstract class representing an instruction in G-Code. Used for simple instructions that do not require
    user inputs, such as "M2".

    Args:
      instruction (str) : The instruction to use.
      comment (str) : A comment representing the instruction's purpose."""

    def __init__(self, instruction: str, comment: str):
        self.instruction = instruction
        self.comment = comment

    def __str__(self) -> str:
        return f"{self.comment}"

    def to_g_code(self) -> str:
        """
        Convert instruction to G-Code.

        Returns:
          string
            A special instruction in G-Code format.
        """
        return f"{self.instruction}"


class Instruction2DPlotterPlottingHeight(_AbstractSimpleInstruction):
    """
    Connect plotting instrument to plotting surface
    """

    def __init__(self) -> None:
        super().__init__("M3 S1000", "Connect plotting instrument to plotting surface")


class Instruction2DPlotterNavigationHeight(_AbstractSimpleInstruction):
    """
    Separate plotting instrument from plotting surface
    """

    def __init__(self) -> None:
        super().__init__(
            "M3 S0",
            "Separate plotting instrument from plotting surface",
        )


class InstructionUnitsMM(_AbstractSimpleInstruction):
    """
    Set the units of the layer to mm
    """

    def __init__(self) -> None:
        super().__init__("G21", "Set the units of the layer to mm")


class InstructionProgramEnd(_AbstractSimpleInstruction):
    """
    Instruct the plotting device that plotting has completed
    """

    def __init__(self) -> None:
        super().__init__(
            "M2", "Instruct the plotting device that plotting has completed"
        )
