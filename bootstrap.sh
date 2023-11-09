#!/bin/bash

###############################################
# Bootstrap script for setting up a new repo. #
###############################################

###############################################
# Install dependencies                        #
###############################################

# python3 -m venv gcode2dplotterart-venv
# source ./gcode2dplotterart-venv/bin/activate
# pip install .

###############################################
# Create the pre-commit hook script           #
###############################################

# Copy the pre-commit hook file

cp git/hooks/pre-commit .git/hooks

# Make the script executable
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

