# 2d-plotter-art-gcode


## Deploy to PyPi

1. Build `python -m build`
2. Deploy `python3 -m twine upload --repository testpypi dist/*`
3. Username is `__token__`, Password is generated [here](https://pypi.org/manage/account/#api-tokens).

## Local Development

1. Install VS Code Plugins - "Black Formatter", "Mypy", and "Flake8"
2. Run `./bootstrap.sh`
3. Make changes to code.
4. Experiment within `src/sandbox.py` to test updated functionality.
5. Generate docs with `./docstrings2md.sh`
6. Create a pull request with changes. 

## `examples` and `sandbox` Directories

1. Activate a virtual environment with ` python3 -m venv sandbox-venv`
2. Activate virtual environment source `./sandbox-venv/bin/activate`
3. Install `pip install -r requirements.txt`
4. The sandbox should have access to the latest code. If not, run ` pip install --editable .` with the venv activated from the root of the repo.