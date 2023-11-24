from typing import Union, Literal

THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"], Literal["Silent"]]

TPlottingPhase = Union[Literal["setup"], Literal["plotting"], Literal["teardown"]]
