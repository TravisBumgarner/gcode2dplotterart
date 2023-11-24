from typing import Union, Literal

THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"]]
TInstructionPhase = Union[Literal["setup"], Literal["plotting"], Literal["teardown"]]
