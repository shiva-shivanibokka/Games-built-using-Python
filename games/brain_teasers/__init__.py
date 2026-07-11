"""Brain Teasers: multiple-choice puzzles generated fresh from a seed.

generate(seed=None, kind=None, difficulty="medium") -> {
    type, prompt, options[4], answer(int 0-3), explanation, seed, kind, difficulty
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

# Which puzzle types each difficulty may draw from. Harder tiers unlock the
# harder types on top of the easier pool (sequences/oddoneout are the gentlest,
# cryptarithm the toughest).
DIFFICULTY_KINDS = {
    "easy": ["sequences", "oddoneout"],
    "medium": ["sequences", "oddoneout", "logic"],
    "hard": ["sequences", "oddoneout", "logic", "cryptarithm"],
}

__all__ = ["generate", "KINDS", "DIFFICULTY_KINDS"]


def generate(seed=None, kind=None, difficulty="medium"):
    if seed is None:
        seed = random.randrange(1 << 31)
    rng = random.Random(seed)
    if kind not in KINDS:
        pool = DIFFICULTY_KINDS.get(difficulty, DIFFICULTY_KINDS["medium"])
        kind = rng.choice(pool)
    result = KINDS[kind](rng)
    result["seed"] = seed
    result["kind"] = kind
    result["difficulty"] = difficulty
    return result
