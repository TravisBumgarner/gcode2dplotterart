import shutil
import os

def folder_setup():
    shutil.rmtree('./output')
    os.mkdir('./output')