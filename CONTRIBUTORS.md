# Contributors

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

## Local Documentation Development

1. `cd gcode2dplotterart-website`
2. Install website `yarn`
3. Run `yarn start`

## Local Library Development

1. Install VS Code Plugins - "Black Formatter", "Mypy", and "Flake8"
2. Run `./bootstrap.sh`
3. Make changes to code.
4. Experiment within `src/sandbox.py` to test updated functionality.
   1. `source ./sandbox-venv/bin/activate`
5. Generate docs with `./docstrings2md.sh`
6. Create a pull request with changes.

## Running Tests and Linting

1. `source ./.venv/bin/activate`
1. `pytest`
   - If tests fail, run `GENERATE_SNAPSHOTS=yes pytest` to generate new snapshots, compare diff to ensure changes are expected, and commit the new snapshots.
1. `mypy ./gcode2dplotterart `
1. `black ./gcode2dplotterart --check`
1. `flake8 --max-line-length 160 ./gcode2dplotterart`

## Generating Timelapses

Setup a camera to take photos of the plotter. Output those photos to `folder/file.jpg`. Run the following script. Change `60` to match the desired FPS

Install dependency - `brew install ffmpeg`

```
ffmpeg -framerate 60 -pattern_type glob -i 'folder/filename_*.jpg' -c:v libx264 -r 60 -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -pix_fmt yuv420p output.mp4
```
