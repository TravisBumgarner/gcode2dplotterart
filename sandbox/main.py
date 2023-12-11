from gcode2dplotterart import Plotter2D

plotter = Plotter2D(
    title="chars", x_min=0, x_max=200, y_min=0, y_max=120, feed_rate=10000
)
plotter.add_layer("black", line_width=2.5)


def line_a(segment_length: float, char_x_start: float, char_y_start: float):
    return [
        (char_x_start, char_y_start + segment_length * 2),
        (char_x_start + segment_length, char_y_start + segment_length * 2),
    ]


def line_b(segment_length: float, char_x_start: float, char_y_start: float):
    return [
        (char_x_start + segment_length, char_y_start + segment_length),
        (char_x_start + segment_length, char_y_start + segment_length * 2),
    ]


def line_c(segment_length: float, char_x_start: float, char_y_start: float):
    return [
        (char_x_start + segment_length, char_y_start),
        (char_x_start + segment_length, char_y_start + segment_length),
    ]


def line_d(segment_length: float, char_x_start: float, char_y_start: float):
    return [(char_x_start, char_y_start), (char_x_start + segment_length, char_y_start)]


def line_e(segment_length: float, char_x_start: float, char_y_start: float):
    return [(char_x_start, char_y_start), (char_x_start, char_y_start + segment_length)]


def line_f(segment_length: float, char_x_start: float, char_y_start: float):
    return [
        (char_x_start, char_y_start + segment_length),
        (char_x_start, char_y_start + segment_length * 2),
    ]


def line_g(segment_length: float, char_x_start: float, char_y_start: float):
    return [
        (char_x_start, char_y_start + segment_length),
        (char_x_start + segment_length, char_y_start + segment_length),
    ]


def point_dp(
    segment_length: float,
    char_x_start: float,
    char_y_start: float,
    point_offset: float,
):
    return [
        (char_x_start + segment_length + point_offset, char_y_start),
    ]


def space(segment_length: float, char_x_start: float, char_y_start: float):
    return [
        (char_x_start, char_y_start),
        (char_x_start + segment_length, char_y_start),
    ]


# TODO -  Characters have been manually ordered such that the least amount of pen lifts occurs. _ indicates a pen lift
character_map = {
    "1": "bc",
    "2": "abged",
    "3": "abg_cd",
    "4": "fgb_c",
    "5": "afgcd",
    "6": "afedcg",
    "7": "abc",
    "8": "abgf_cde",
    "9": "gfabcd",
    "0": "abcdef",
    "a": "efabc_g",
    "b": "fedcg",
    "c": "afed",
    "d": "bcdeg",
    "e": "afg_ed",
    "f": "afe_g",
    "g": "afedc",
    "h": "fe_gc",
    "i": "ea",
    "j": "bcde",
    "k": "afe_gc",
    "l": "fed",
    "m": "a_e_c",
    "n": "efabc",
    "o": "abcdef",
    "p": "efabg",
    "q": "gfabc",
    "r": "efab",
    "s": "afgcd",
    "t": "fed_g",
    "u": "fedcb",
    "v": "f_bcd",
    "w": "f_b_d",
    "x": "fe_g_bc",
    "y": "f_bcd",
    "z": "abg_d",
    "-": "g",
    "_": "d",
    "[": "afed",
    "]": "abcd",
    "^": "fab",
    "!": "b_p",
    "'": "f",
    ".": "p",
    ",": "cd",
    "<": "afg",
    ">": "abg",
    "?": "abge",
    "=": "a_g",
    " ": " ",
}

primitive_map = {
    "a": line_a,
    "b": line_b,
    "c": line_c,
    "d": line_d,
    "e": line_e,
    "f": line_f,
    "g": line_g,
    "p": point_dp,
    " ": space,
}


def draw_character(
    character_to_draw: str,
    font_size: float,
    char_x_start: float,
    char_y_start: float,
    point_offset: float = 1,
):
    """
    Draw a single character. The character will be drawn at the specified x and y start coordinates.

    Args:
    - character_to_draw (str): The character to draw. Must be a single character.
    - font_size (float): The size of the font to draw the character in, units are mm.
    - char_x_start (float): The x-coordinate to start drawing the character at. Positioned to the left of the character.
    - char_y_start (float): The y-coordinate to start drawing the character at. Positioned to the bottom of the character.
    - point_offset (float, optional): The offset of the point in the character, units are mm. Used for characters such as `!`. Defaults to 1.2.
    """
    segment_length = font_size / 2

    if character_to_draw not in character_map:
        raise ValueError(
            f"Character {character_to_draw} is not supported, supported characters are {character_map.keys()}"
        )

    primitives = character_map[character_to_draw]

    paths = []
    for primitive in primitives:
        if primitive == "_":
            # Note - _ was supposed to denote seperate paths. But the logic to do so is decently complicated. Leaving in to be computed later.
            continue

        draw_primitive = primitive_map[primitive]
        if primitive == "p":
            paths.append(
                draw_primitive(
                    segment_length,
                    char_x_start,
                    char_y_start,
                    point_offset,
                )
            )
            continue

        if primitive == " ":
            char_x_start += segment_length
            continue

        paths.append(draw_primitive(segment_length, char_x_start, char_y_start))
    return paths


def draw_text(
    text_to_draw: str,
    font_size: float,
    char_spacing: float,
    x_start: float,
    y_start: float,
    point_offset: float = 1,
):
    segment_length = font_size / 2

    for character in text_to_draw.lower():
        paths = draw_character(
            character,
            font_size,
            x_start,
            y_start,
            point_offset=point_offset,
        )

        for path in paths:
            plotter.layers["black"].add_path(path)

        x_start += segment_length + char_spacing
    return paths


chars = "".join(character_map.keys())


def split_into_chunks(input_string, chunk_size=15):
    return [
        input_string[i : i + chunk_size]
        for i in range(0, len(input_string), chunk_size)
    ]


rows = split_into_chunks(chars)

for index, row in enumerate(rows):
    draw_text(
        row,
        font_size=15,
        char_spacing=5,
        x_start=0,
        y_start=plotter.y_max - index * 24 - 20,
    )

draw_text(
    "It's fun to see progress!!", font_size=10, char_spacing=2, x_start=0, y_start=0
)

plotter.preview()

plotter.save()
