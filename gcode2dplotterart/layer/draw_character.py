from typing import List, Tuple, Callable, Dict


def line_a(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [
        (char_x_start, char_y_start + segment_length * 2),
        (char_x_start + segment_length, char_y_start + segment_length * 2),
    ]


def line_b(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [
        (char_x_start + segment_length, char_y_start + segment_length),
        (char_x_start + segment_length, char_y_start + segment_length * 2),
    ]


def line_c(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [
        (char_x_start + segment_length, char_y_start),
        (char_x_start + segment_length, char_y_start + segment_length),
    ]


def line_d(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [(char_x_start, char_y_start), (char_x_start + segment_length, char_y_start)]


def line_e(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [(char_x_start, char_y_start), (char_x_start, char_y_start + segment_length)]


def line_f(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [
        (char_x_start, char_y_start + segment_length),
        (char_x_start, char_y_start + segment_length * 2),
    ]


def line_g(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
    return [
        (char_x_start, char_y_start + segment_length),
        (char_x_start + segment_length, char_y_start + segment_length),
    ]


def point_dp(
    segment_length: float,
    char_x_start: float,
    char_y_start: float,
    point_offset: float,
) -> List[Tuple[float, float]]:
    return [
        (char_x_start + segment_length + point_offset, char_y_start),
    ]


def space(
    segment_length: float, char_x_start: float, char_y_start: float
) -> List[Tuple[float, float]]:
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
    "i": "fe",
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
    "y": "fgb_cd",
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


PrimitiveFunction = Callable[[float, float, float], List[Tuple[float, float]]]


primitive_map: Dict[str, PrimitiveFunction] = {
    "a": line_a,
    "b": line_b,
    "c": line_c,
    "d": line_d,
    "e": line_e,
    "f": line_f,
    "g": line_g,
    " ": space,
}


def draw_character(
    character: str,
    x_start: float,
    y_start: float,
    segment_length: float,
    point_offset: float,
) -> List[List[Tuple[float, float]]]:
    """
    Draw a single character. The character will be drawn at the specified x and y start coordinates.

    Args:
    - character (str): The character to draw. Must be a single character.
    - font_size (float): The size of the font to draw the character in, units are mm.
    - x_start (float): The x-coordinate to start drawing the character at. Positioned to the left of the character.
    - y_start (float): The y-coordinate to start drawing the character at. Positioned to the bottom of the character.
    - segment_length (float): The length of each segment of the character, units are mm.
    - point_offset (float, optional): The offset of the point in the character, units are mm. Used for characters such as `!`.

    Returns:
    - list: A list of paths to draw the character. Each path is a list of points.
    """

    if character not in character_map:
        raise ValueError(
            f"Character {character} is not supported, supported characters are {character_map.keys()}"
        )

    primitives = character_map[character]

    paths = []
    for primitive in primitives:
        if primitive == "_":
            # Note - _ was supposed to denote seperate paths. But the logic to do so is decently complicated. Leaving in to be computed later.
            continue

        draw_primitive = primitive_map[primitive]
        if primitive == "p":
            paths.append(
                point_dp(
                    segment_length,
                    x_start,
                    y_start,
                    point_offset,
                )
            )
            continue

        if primitive == " ":
            x_start += segment_length
            continue

        paths.append(draw_primitive(segment_length, x_start, y_start))
    return paths
