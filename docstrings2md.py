import inspect
import os
from gcode2dplotterart import Plotter3D, Plotter2D
from gcode2dplotterart.Layer import Layer3D, Layer2D


def method_to_markdown(class_obj, method_name):
    method = getattr(class_obj, method_name)
    signature = str(inspect.signature(method))

    signature = signature.replace("(", "")
    signature = signature.replace(")", "")

    [params_value, return_value] = signature.split("->")

    params = "".join([f"  {param.strip()}\n" for param in params_value.split(",")])

    return f"```python\n{method_name}(\n{params})\n -> {return_value}\n```\n\n"


def class_to_markdown(class_name, class_obj):
    markdown_content = f"# {class_name}\n\n"

    for name, member in inspect.getmembers(class_obj):
        if name.startswith("_") and not name.startswith("__"):
            continue
        if inspect.isfunction(member):
            docstring = inspect.getdoc(member)
            docstring = docstring.replace("Args:", "**Args:** ")
            docstring = docstring.replace("Returns:", "**Returns:** ")
            docstring = docstring.replace("Raises:", "**Raises:** ")

            markdown_content += f"## {name}\n\n"
            markdown_content += method_to_markdown(class_obj, name)
            markdown_content += f"{docstring}\n\n"

    return markdown_content


def write_to_file(class_obj, output_directory):
    # Create the output directory if it doesn't exist
    os.makedirs(output_directory, exist_ok=True)
    class_name = class_obj.__name__.split(".")[-1]

    # Generate the Markdown content
    markdown_content = class_to_markdown(class_name, class_obj)

    # Write to file
    file_path = os.path.join(output_directory, f"{class_name}.mdx")
    with open(file_path, "w") as file:
        file.write(markdown_content)


# Specify the output directory
output_directory = "gcode2dplotterart-website/docs/api"

# Use your class (replace MyClass with your actual class)

classes = [Plotter2D, Plotter3D, Layer2D, Layer3D]

for class_ in classes:
    write_to_file(class_, output_directory)
