from typing import Union, Literal

THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"]]

TPlottingPhase = Union[Literal["setup"], Literal["plotting"], Literal["teardown"]]
