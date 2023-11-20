from typing import Union, Literal

THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"], Literal["Silent"]]

TInstructionType = Union[Literal["setup"], Literal["plotting"], Literal["teardown"]]
