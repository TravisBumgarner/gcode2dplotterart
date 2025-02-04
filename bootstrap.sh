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
cd ..
pip install --editable .
cd sandbox
echo "Running sandbox..."
python main.py
deactivate


###############################################
# Setup the pre-commit hook script            #
###############################################

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook file
cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash

# Add your pre-commit checks here
echo "Running pre-commit checks..."

# Run tests
python -m pytest

# Check exit code
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi
EOL

# Make the pre-commit hook executable
chmod +x .git/hooks/pre-commit

echo "Pre-commit hook script created successfully."

