# 2d-plotter-art-gcode

## Deploy to PyPi

1. Build `python -m build`
2. Deploy `python3 -m twine upload --repository testpypi dist/*`
3. Username is `__token__`, Password is generated [here](https://pypi.org/manage/account/#api-tokens).

## Local Development

1. Setup virtual environment `python3 -m venv gcode2dplotterart-venv`
2. Active virtual environment `source ./gcode2dplotterart-venv/bin/activate`
3. Install requirements `pip install -r requirements.txt`
4. Make changes to code.
5. Experiment within `src/sandbox.py` to test updated functionality.
6. Generate docs with `./docstrings2md.py`
7. Create a pull request with changes. 

## `examples` and `sandbox` Directories

To work work with these examples locally, run `pip install --editable .` from the project root directory first. This will install the `gcode2dplotterart` package in editable mode, allowing you to make changes to the package and see them reflected in the examples.