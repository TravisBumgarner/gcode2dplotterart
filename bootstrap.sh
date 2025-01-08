#!/bin/bash

###############################################
# Script for setting up project locally       #
###############################################

###############################################
# Setup Library                               #
###############################################

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Make it so Python can reference the library's live changes.
pip install -e .
deactivate

###############################################
# Setup Sandbox                               #
###############################################

cd sandbox
python -m venv .venv-sandbox
source ./.venv-sandbox/bin/activate
pip install -r requirements.txt


###############################################
# Setup the pre-commit hook script            #
###############################################

cp git/hooks/pre-commit .git/hooks
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

