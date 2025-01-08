#!/bin/bash

###############################################
# Script for setting up project locally       #
###############################################

###############################################
# Setup Library                               #
###############################################

python3 -m venv .venv
source .venv/bin/activate
pip install -e .

###############################################
# Setup Sandbox                               #
###############################################

cd sandbox
python3 -m venv .venv-sandbox
source .venv-sandbox/bin/activate
pip install -r requirements.txt
deactivate

###############################################
# Setup the pre-commit hook script            #
###############################################

cd ..
cp git/hooks/pre-commit .git/hooks
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

