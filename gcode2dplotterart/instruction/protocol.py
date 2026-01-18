from typing import Protocol, runtime_checkable


@runtime_checkable
class Instruction(Protocol):
    """Protocol that all instruction classes must implement."""

    def to_g_code(self) -> str:
        """Convert instruction to G-Code format."""
        ...
