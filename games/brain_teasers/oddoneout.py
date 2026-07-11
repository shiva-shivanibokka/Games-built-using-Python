"""Odd-one-out teaser: four items, exactly one breaks a rule the other three share."""

CATEGORIES = {
    "fruits": ["apple", "banana", "cherry", "mango", "peach", "grape", "lemon", "plum"],
    "animals": ["tiger", "otter", "panda", "zebra", "koala", "walrus", "moose", "lynx"],
    "colors": ["scarlet", "azure", "olive", "violet", "amber", "teal", "maroon", "indigo"],
    "planets": ["mercury", "venus", "mars", "jupiter", "saturn", "neptune", "uranus"],
    "shapes": ["circle", "square", "hexagon", "octagon", "pentagon", "rhombus", "oval"],
}


def _even(rng):
    evens = rng.sample([n for n in range(2, 40, 2)], 3)
    odd = rng.choice([n for n in range(1, 40, 2)])
    items = [str(x) for x in evens] + [str(odd)]
    return items, str(odd), "the other three are even numbers; this one is odd"


def _square(rng):
    squares = rng.sample([k * k for k in range(2, 11)], 3)
    used = set(squares)
    non = rng.choice([n for n in range(4, 101) if n not in used and int(n ** 0.5) ** 2 != n])
    items = [str(x) for x in squares] + [str(non)]
    return items, str(non), "the other three are perfect squares; this one is not"


def _multiple(rng):
    k = rng.choice([3, 4, 5])
    mults = rng.sample([k * m for m in range(2, 13)], 3)
    non = rng.choice([n for n in range(2, 60) if n % k != 0])
    items = [str(x) for x in mults] + [str(non)]
    return items, str(non), f"the other three are multiples of {k}; this one is not"


def _category(rng):
    cats = rng.sample(list(CATEGORIES), 2)
    trio = rng.sample(CATEGORIES[cats[0]], 3)
    outsider = rng.choice(CATEGORIES[cats[1]])
    items = trio + [outsider]
    return items, outsider, f"the other three are {cats[0]}; “{outsider}” is a {cats[1][:-1]}"


def generate(rng):
    items, odd, rule = rng.choice([_even, _square, _multiple, _category])(rng)
    # Guaranteed distinct within each builder; shuffle for display.
    rng.shuffle(items)
    answer = items.index(odd)
    return {
        "type": "oddoneout",
        "prompt": "Which one does not belong?",
        "options": items,
        "answer": answer,
        "explanation": f"{odd} is the odd one out — {rule}.",
    }
