from typing import Literal

THandleOutOfBounds = Literal["Warning"] | Literal["Error"]
TInstructionPhase = Literal["setup"] | Literal["plotting"] | Literal["teardown"]
