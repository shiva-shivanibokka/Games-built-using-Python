"""Brain Teasers: multiple-choice puzzles generated fresh from a seed.

generate(seed=None, kind=None) -> {
    type, prompt, options[4], answer(int 0-3), explanation, seed, kind
}
"""

import random

from . import cryptarithm, logic, oddoneout, sequences

KINDS = {
    "sequences": sequences.generate,
    "cryptarithm": cryptarithm.generate,
    "logic": logic.generate,
    "oddoneout": oddoneout.generate,
}

__all__ = ["generate", "KINDS"]


def generate(seed=None, kind=None):
    if seed is None:
        seed = random.randrange(1 << 31)
    rng = random.Random(seed)
    if kind not in KINDS:
        kind = rng.choice(list(KINDS))
    result = KINDS[kind](rng)
    result["seed"] = seed
    result["kind"] = kind
    return result
