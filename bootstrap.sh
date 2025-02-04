#!/bin/bash

###############################################
# Script for setting up project locally       #
###############################################

###############################################
# Setup Python Environment                    #
###############################################

python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt
# pip install --editable .
deactivate

###############################################
# Setup Python Sandbox Environment            #
###############################################

cd sandbox
python3 -m venv sandbox-venv
source ./sandbox-venv/bin/activate
pip install -r requirements.txt
pip install --editable .
deactivate


###############################################
# Setup the pre-commit hook script            #
###############################################

cp git/hooks/pre-commit .git/hooks
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

