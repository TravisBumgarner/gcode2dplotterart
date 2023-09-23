# 2d-plotter-art-gcode

## Deploy to PyPi

1. Build `python -m build`
2. Deploy `python3 -m twine upload --repository testpypi dist/*`
3. Username is `__token__`, Password is generated [here](https://pypi.org/manage/account/#api-tokens).

## Local Development

1. Setup virtual environment `python3 -m venv gcode2dplotterart-venv`
2. Active virtual environment `source ./gcode2dplotterart-venv/bin/activate`
3. Install requirements `pip install -r requirements.txt`
