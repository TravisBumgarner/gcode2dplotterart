# 2d-plotter-art-g-code


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

## `sandbox` Directory

`sandbox` directory has the library installed in editable mode with access to the latest library code. This is used for testing changes. 

1. Install a virtual environment with ` python3 -m venv sandbox-venv`
2. Activate virtual environment source `./sandbox-venv/bin/activate`
3. Install requirements `pip install -r requirements.txt`
4. The sandbox should have access to the latest code. If not, run ` pip install --editable .` with the venv activated from the root of the repo.

## Running Tests

1. `poetry run pytest`
2. If tests fail, run `GENERATE_SNAPSHOTS=yes poetry run pytest` to generate new snapshots, compare diff to ensure changes are expected, and commit the new snapshots.