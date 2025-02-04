# 2d-plotter-art-g-code

## Local Setup

1. Install VS Code Plugins - "Black Formatter", "Mypy", and "Flake8"
2. Run `./bootstrap.sh`

## Running Tests

1. `pytest`
2. If tests fail, run `GENERATE_SNAPSHOTS=yes pytest` to generate new snapshots, compare diff to ensure changes are expected, and commit the new snapshots.

## Local Development

1. Make changes to code.
1. Experiment within `src/sandbox/main.py` to test updated functionality.
1. Docstrings will be generated automatically with precommit via `docstrings2md.py`, be sure to commit the new docs as well.
1. Create a pull request with changes.

## Deploy

1. Add following code to `~/.pypirc`. See below for filling in details.
   - PyPi Test
     1. Username: `__token__`
     1. Password: [Password](https://test.pypi.org/manage/account/#api-tokens)
   - PyPi
     1. Username: `__token__`
     1. Password: [Password](https://pypi.org/manage/account/#api-tokens)

```
[distutils]
index-servers =
    pypi
    testpypi

[testpypi]
repository = https://test.pypi.org/legacy/
username = sillysideprojects
password = foobar

[pypi]
repository = https://upload.pypi.org/legacy/ 
username = __token__
password = buzzfizz
```

2. Increment package number.
3. Build package `rm -rf ./dist && python -m build`
4. Deploy package `python -m twine upload --repository testpypi dist/*`
5. Navigate to [TestPyPI](https://test.pypi.org/project/gcode2dplotterart/), create new `venv`
6. Install package with `pip install -i https://test.pypi.org/simple/ gcode2dplotterart==2.0.3 --extra-index-url https://pypi.org/simple/`
7. Run the following test code.

```
from gcode2dplotterart import Plotter2D

plotter = Plotter2D(
    title="Test",
    x_min=0,
    x_max=100,
    y_min=0,
    y_max=100,
    feed_rate=1000,
    handle_out_of_bounds="Warning",
    output_directory="./output",
    include_comments=True,
    return_home_before_plotting=True,
)

plotter.add_layer("foo", "red", line_width=1)

plotter.layers["foo"].add_line(
    x_start=0,
    y_start=0,
    x_end=100,
    y_end=100,
)

plotter.preview()

plotter.save()
```

8. Deploy to production `python -m twine upload --repository pypi dist/*`

## Generating Timelapses

Setup a camera to take photos of the plotter. Output those photos to `folder/file.jpg`. Run the following script. Change `60` to match the desired FPS

```
ffmpeg -framerate 60 -pattern_type glob -i 'folder/filename_*.jpg' -c:v libx264 -r 60 -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -pix_fmt yuv420p output.mp4
```
