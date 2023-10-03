# for details see https://stackoverflow.com/questions/36237477/python-docstrings-to-github-readme-md
# further details in https://blog.matteoferla.com/2019/11/convert-python-docstrings-to-github.html

import re
import shutil
import os
import subprocess

# ## Settings
repo_path = '/Users/travisbumgarner/Programming/gcode2dplotterart'
module_name = 'gcode2dplotterart'
author_name = 'Travis Bumgarner'

# ## Apidoc call
os.system('pip install sphinx sphinx-markdown-builder sphinx-autodoc-typehints')
os.chdir(repo_path)
arguments = ['-o',
            'Sphinx-docs',
            module_name,
            'sphinx-apidoc',
            '--full',
            '-A',
            f"'${author_name}'",
            '--module-first',
            ]
proc = subprocess.run(["sphinx-apidoc", *arguments], capture_output=True)
if r := proc.stderr:
    raise RuntimeError(r.decode())
print(proc.stdout.decode())

# ## tweak configuration

with open('Sphinx-docs/conf.py') as fh:
    conf_codeblock = fh.read()
conf_codeblock = conf_codeblock.replace('# import os', 'import os')\
          .replace('# import sys', 'import sys\nsys.path.insert(0, os.path.abspath("../"))')\
          .replace("'sphinx.ext.autodoc',", "'sphinx.ext.autodoc','sphinx_autodoc_typehints',")
conf_codeblock += '''
def skip(app, what, name, obj, would_skip, options):
    if name in ( '__init__',):
        return False
    return would_skip
def setup(app):
    app.connect('autodoc-skip-member', skip)
'''

with open('Sphinx-docs/conf.py', 'w') as fh:
    fh.write(conf_codeblock)

# ## Make

os.chdir('Sphinx-docs')
os.system('make html')
os.rename('./_build/html', './_build/docs')
shutil.rmtree('../docs')
shutil.move('./_build/docs', '../')

os.chdir('..')

# ## Removing Sphynx folder
shutil.rmtree('Sphinx-docs')