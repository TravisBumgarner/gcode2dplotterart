from typing import Literal
from typing_extensions import TypedDict

HandleOutOfBounds = Literal["Warning", "Error"]
InstructionPhase = Literal["setup", "plotting", "teardown"]


class Bounds(TypedDict):
    x_min: float
    x_max: float
    y_min: float
    y_max: float
