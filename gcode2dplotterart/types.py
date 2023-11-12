from typing import Union, Literal

THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"], Literal["Silent"]]

TUnits = Union[Literal["mm"], Literal["inches"]]

TInstructionType = Union[Literal["setup"], Literal["plotting"], Literal["teardown"]]
