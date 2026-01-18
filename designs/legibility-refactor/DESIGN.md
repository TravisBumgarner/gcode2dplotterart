# Legibility Refactor Design

## Overview

This refactoring project aims to improve the gcode2dplotterart library's:
- **IntelliSense/IDE support** - Better type hints that display clearly in editors
- **Code legibility** - Reduce repetition and improve maintainability
- **Documentation generation** - Replace the brittle `docstrings2md.py` with proper tooling

## Current Problems

### 1. Poor IntelliSense Support

**Type aliases don't display well:**
```python
# Current - shows as Union[Literal['Warning'], Literal['Error']] in IDE
THandleOutOfBounds = Union[Literal["Warning"], Literal["Error"]]

# Better - shows as "Warning" | "Error" in modern IDEs
HandleOutOfBounds = Literal["Warning", "Error"]
```

**Instruction classes lack a common interface:**
- `InstructionFeedRate` doesn't inherit from `_BaseInstruction`
- `Instruction3DPrinterPlottingHeight` doesn't inherit from `_BaseInstruction`
- This breaks type inference and IDE autocomplete

**Class attributes declared without types in some places:**
- `_AbstractPlotter` declares attributes at class level but also in `__init__`
- Inconsistent patterns confuse type checkers

### 2. Repetitive Code

**Plotter2D vs Plotter3D:**
- 90% identical code
- Only difference: Plotter3D has `z_plotting_height` and `z_navigation_height`
- Could use generics or a factory pattern

**Layer2D vs Layer3D:**
- 95% identical code
- Only difference: `set_mode_to_plotting()` and `set_mode_to_navigation()` implementations
- Abstract base already exists but subclasses still have repetitive `__init__` docstrings

**Long parameter lists:**
- `_AbstractLayer.__init__` takes 10 parameters
- These get repeated in docstrings for Layer2D and Layer3D
- Could use dataclasses or parameter objects

### 3. Brittle Documentation Generation

**docstrings2md.py issues:**
- Hardcoded string manipulation (`signature.split("->")`)
- Produces ugly output with `Union[Literal['x'], Literal['y']]`
- Line wrapping issues in generated markdown
- No support for nested types or complex signatures

**Better alternatives:**
- Use Sphinx with autodoc for proper API documentation
- Or use mkdocs with mkdocstrings
- Both handle type annotations properly and produce clean output

## Proposed Changes

### Phase 1: Fix Type Hints for Better IntelliSense

1. **Simplify type aliases** in `shared_types.py`:
   ```python
   # Use simple Literal syntax
   HandleOutOfBounds = Literal["Warning", "Error"]
   InstructionPhase = Literal["setup", "plotting", "teardown"]
   ```

2. **Create proper Instruction protocol/base class:**
   ```python
   class Instruction(Protocol):
       def to_g_code(self) -> str: ...
       def __str__(self) -> str: ...
   ```

3. **Ensure all instruction classes implement the protocol**

4. **Use TypedDict for bounds dictionaries:**
   ```python
   class Bounds(TypedDict):
       x_min: float
       x_max: float
       y_min: float
       y_max: float
   ```

### Phase 2: Reduce Repetition with Dataclasses

1. **Create a PlotterConfig dataclass:**
   ```python
   @dataclass
   class PlotterConfig:
       title: str
       x_min: float
       x_max: float
       y_min: float
       y_max: float
       feed_rate: float
       handle_out_of_bounds: HandleOutOfBounds = "Warning"
       output_directory: str = "./output"
       include_comments: bool = True
       return_home_before_plotting: bool = True
   ```

2. **Create a LayerConfig dataclass** to reduce `__init__` parameter sprawl

3. **Simplify Plotter2D/Plotter3D** to only contain their specific logic

### Phase 3: Replace docstrings2md.py

1. **Delete docstrings2md.py**

2. **Add Sphinx with autodoc** or **mkdocs with mkdocstrings**:
   - Properly handles type annotations
   - Generates clean, navigable API docs
   - Integrates with Docusaurus or replaces it

3. **Update docstrings to use standard format** (Google or NumPy style consistently)

### Phase 4: Consolidate Instruction Classes

1. **Merge SimpleInstruction.py and InstructionWithArguments.py** into a single `instructions.py`

2. **Use a single base class pattern:**
   ```python
   @dataclass
   class Instruction(ABC):
       @abstractmethod
       def to_g_code(self) -> str: ...

   @dataclass
   class PointInstruction(Instruction):
       x: float
       y: float
       feed_rate: float

       def to_g_code(self) -> str:
           return f"G1 X{self.x:.3f} Y{self.y:.3f} F{self.feed_rate}"
   ```

3. **Remove redundant `__str__` methods** where they just duplicate `to_g_code`

## File Changes Summary

| File | Action |
|------|--------|
| `shared_types.py` | Refactor type aliases, add TypedDict |
| `instruction/SimpleInstruction.py` | Merge into `instructions.py` |
| `instruction/InstructionWithArguments.py` | Merge into `instructions.py` |
| `instruction/__init__.py` | Update exports |
| `_Plotter.py` | Use PlotterConfig dataclass |
| `Plotter2D.py` | Simplify using config |
| `Plotter3D.py` | Simplify using config |
| `layer/_Layer.py` | Use LayerConfig dataclass |
| `layer/Layer2D.py` | Simplify using config |
| `layer/Layer3D.py` | Simplify using config |
| `docstrings2md.py` | DELETE |
| `pyproject.toml` | Add sphinx/mkdocs dependencies |
| New: `docs/` | Sphinx/mkdocs configuration |

## Testing Strategy

- All existing snapshot tests must pass
- Run mypy to verify type improvements
- Manual verification of IntelliSense in VS Code/PyCharm
- Verify generated documentation renders correctly

## Migration Notes

- Public API remains unchanged (Plotter2D, Plotter3D, Layer2D, Layer3D)
- Internal restructuring is transparent to users
- No breaking changes to existing code using the library
