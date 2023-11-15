#!/bin/bash

###############################################
# Script for setting up project locally       #
###############################################

###############################################
# Install dependencies                        #
###############################################

python3 -m venv sandbox-venv
source ./sandbox-venv/bin/activate
pip install -r requirements-sandbox.txt

# Make it so Python can reference the library's live changes.
pip install --editable .

###############################################
# Setup the pre-commit hook script            #
###############################################

cp git/hooks/pre-commit .git/hooks
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

