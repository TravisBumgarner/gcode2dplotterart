from typing import Union, Literal

THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"], Literal["Partial"]]
TInstructionPhase = Union[Literal["setup"], Literal["plotting"], Literal["teardown"]]
