# 2d-plotter-art-g-code


## Deploy to PyPi Test

1. `poetry build`
2. Username is `__token__` Generate [test password](https://test.pypi.org/manage/account/#api-tokens) or get it from the `.env`.
3. `poetry config pypi-token.testpypi [TOKEN_FROM_DOT_ENV]`
4. `poetry publish --repository testpypi`

## Deploy to PyPi

1. `poetry build`
2. Username is `__token__` Generate [production password](https://pypi.org/manage/account/#api-tokens) or get it from the `.env`.
3. `poetry config pypi-token.pypi [TOKEN_FROM_DOT_ENV]`
4. `poetry publish`


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


## Generating Timelapses

Setup a camera to take photos of the plotter. Output those photos to `folder/file.jpg`. Run the following script. Change `60` to match the desired FPS

```
ffmpeg -framerate 60 -pattern_type glob -i 'folder/filename_*.jpg' -c:v libx264 -r 60 -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -pix_fmt yuv420p output.mp4
```
