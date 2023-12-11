def connect_lines(lines):
    if not lines:
        return []

    connected_lines = [lines[0]]

    for line in lines[1:]:
        # Check if the endpoint of the last line matches the starting point of the current line
        if connected_lines[-1][-1] == line[0]:
            # If so, append the entire line to the connected_lines
            connected_lines[-1].extend(line[1:])
        else:
            # If not, add the line as a new segment
            connected_lines.append(line)

    return connected_lines


# Example usage:
lines = [
    [(0, 50.0), (25.0, 50.0)],
    [(25.0, 25.0), (25.0, 50.0)],
    [(0, 25.0), (25.0, 25.0)],
    [(0, 0), (0, 25.0)],
    [(0, 0), (25.0, 0)],
]

result = connect_lines(lines)
print(result)
