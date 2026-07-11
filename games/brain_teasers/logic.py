"""Deductive ordering teaser: rank people on one attribute from chained clues."""

NAMES = ["Ana", "Bo", "Cy", "Dez", "Eli", "Fern", "Gus", "Ivy", "Jo", "Kit"]
ATTRS = [
    ("taller", "tallest", "shortest"),
    ("older", "oldest", "youngest"),
    ("faster", "fastest", "slowest"),
]


def generate(rng):
    n = 4  # exactly four people -> exactly four options
    people = rng.sample(NAMES, n)
    order = people[:]           # order[0] is the greatest (tallest/oldest/…)
    rng.shuffle(order)
    comp, most, least = rng.choice(ATTRS)

    # Adjacent-pair clues fully determine the strict order.
    clues = [f"{order[i]} is {comp} than {order[i + 1]}" for i in range(n - 1)]
    rng.shuffle(clues)

    if rng.random() < 0.5:
        who, word = order[0], most
    else:
        who, word = order[-1], least

    prompt = ". ".join(clues) + f".\nWho is {word}?"

    options = people[:]
    rng.shuffle(options)
    answer = options.index(who)
    ordered = " > ".join(order)
    return {
        "type": "logic",
        "prompt": prompt,
        "options": options,
        "answer": answer,
        "explanation": f"Order ({most} → {least}): {ordered}. So {who} is {word}.",
    }
