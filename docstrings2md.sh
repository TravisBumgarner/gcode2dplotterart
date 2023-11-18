source "$(poetry env info --path)/bin/activate"

# I for the life of me can't figure out how to make pydoc-markdown work with hex colors. This is lazy.
python_file_path="./gcode2dplotterart/Plotter.py"
mdx_file_path="./gcode2dplotterart-website/docs/api/Layer.mdx"

no_hex="00FF00"
with_hex="#00FF00"

# Use sed to replace the string in the file
sed -i "" "s/${with_hex}/${no_hex}/g" "${python_file_path}"

# Run pydoc-markdown
pydoc-markdown -m gcode2dplotterart/Plotter -I $(pwd) > ./gcode2dplotterart-website/docs/api/Plotter.mdx
pydoc-markdown -m gcode2dplotterart/Layer -I $(pwd) > ./gcode2dplotterart-website/docs/api/Layer.mdx

# Revert the changes in the file
sed -i "" "s/${no_hex}/${with_hex}/g" "${python_file_path}"
sed -i "" "s/${no_hex}/${with_hex}/g" "${mdx_file_path}"

