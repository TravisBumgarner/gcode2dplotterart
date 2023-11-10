#!/bin/bash

###############################################
# Script for setting up project locally       #
###############################################

###############################################
# Install dependencies                        #
###############################################

# python3 -m venv gcode2dplotterart-venv
# source ./gcode2dplotterart-venv/bin/activate
# pip install .

###############################################
# Setup the pre-commit hook script            #
###############################################

cp git/hooks/pre-commit .git/hooks
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

