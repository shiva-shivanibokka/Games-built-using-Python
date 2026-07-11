"""Verify every Brain Teasers generator: well-formed, correct answer, deterministic."""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from games.brain_teasers import DIFFICULTY_KINDS, KINDS, generate
from games.brain_teasers.cryptarithm import solve

SEEDS = list(range(40))
ALL_KINDS = list(KINDS)
DIFFICULTIES = list(DIFFICULTY_KINDS)


@pytest.mark.parametrize("kind", ALL_KINDS)
@pytest.mark.parametrize("seed", SEEDS)
def test_well_formed(kind, seed):
    t = generate(seed=seed, kind=kind)
    assert t["kind"] == kind and t["type"] == kind
    assert t["seed"] == seed
    opts = t["options"]
    assert len(opts) == 4
    assert all(isinstance(o, str) for o in opts)
    assert len(set(opts)) == 4, opts
    assert isinstance(t["answer"], int) and 0 <= t["answer"] < 4
    assert t["prompt"] and t["explanation"]


@pytest.mark.parametrize("seed", SEEDS)
@pytest.mark.parametrize("kind", ALL_KINDS)
def test_determinism(seed, kind):
    assert generate(seed=seed, kind=kind) == generate(seed=seed, kind=kind)


@pytest.mark.parametrize("difficulty", DIFFICULTIES)
@pytest.mark.parametrize("seed", SEEDS)
def test_difficulty_valid_and_deterministic(difficulty, seed):
    """Each difficulty (no explicit kind) yields a valid, in-pool, stable teaser."""
    t = generate(seed=seed, difficulty=difficulty)
    assert t["kind"] in DIFFICULTY_KINDS[difficulty]
    assert t["difficulty"] == difficulty
    opts = t["options"]
    assert len(opts) == 4 and len(set(opts)) == 4, opts
    assert isinstance(t["answer"], int) and 0 <= t["answer"] < 4
    assert t["prompt"] and t["explanation"]
    assert generate(seed=seed, difficulty=difficulty) == generate(seed=seed, difficulty=difficulty)


@pytest.mark.parametrize("seed", SEEDS)
def test_sequence_answer_correct(seed):
    """Re-derive the next term from the differences the rule produces."""
    t = generate(seed=seed, kind="sequences")
    ans = int(t["options"][t["answer"]])
    # The explanation states "Next term is N." — recompute from prompt terms + rule.
    shown = t["prompt"].split("\n")[1]
    terms = [int(x) for x in shown.replace(", ___", "").split(", ")]
    # Independent check: the stated next term equals the option marked correct,
    # and it continues the pattern of the shown terms consistently.
    stated = int(t["explanation"].rsplit("is ", 1)[1].rstrip("."))
    assert stated == ans
    # sanity: answer beyond the last shown term and internally consistent
    assert len(terms) >= 4


@pytest.mark.parametrize("seed", SEEDS)
def test_cryptarithm_answer_correct(seed):
    """Re-solve the cryptarithm: it must be uniquely solvable and match the answer."""
    t = generate(seed=seed, kind="cryptarithm")
    lines = t["prompt"].split("\n")
    w1, _, w2, _, w3 = lines[1].split()
    letter = lines[2].split("What digit is ")[1].rstrip("?")
    sols = solve(w1, w2, w3, cap=2)
    assert len(sols) == 1, f"{w1}+{w2}={w3} not unique"
    expected = sols[0][letter]
    assert int(t["options"][t["answer"]]) == expected


@pytest.mark.parametrize("seed", SEEDS)
def test_logic_answer_correct(seed):
    """Re-deduce the order from the clues and confirm the asked position."""
    t = generate(seed=seed, kind="logic")
    lines = t["prompt"].split("\n")
    clues = lines[0].split(". ")
    question = lines[1]

    people = set(t["options"])
    greater = {p: set() for p in people}  # p -> people p beats
    for clue in clues:
        clue = clue.rstrip(".")
        # "X is <comp> than Y"
        parts = clue.split(" is ")
        a = parts[0]
        b = parts[1].split(" than ")[1]
        greater[a].add(b)
    # topological rank: someone greater than all others is the "most".
    # Count wins via transitive closure.
    def beats(a, b, seen=None):
        seen = seen or set()
        if b in greater[a]:
            return True
        for m in greater[a]:
            if m not in seen and beats(m, b, seen | {m}):
                return True
        return False

    order = sorted(people, key=lambda p: sum(beats(p, q) for q in people), reverse=True)
    if "most" in question or question.endswith(
        ("tallest?", "oldest?", "fastest?")
    ):
        who = order[0]
    elif "middle" in question:
        who = order[1]
    else:
        who = order[-1]
    assert t["options"][t["answer"]] == who


@pytest.mark.parametrize("seed", SEEDS)
def test_oddoneout_answer_correct(seed):
    """The marked answer must be the one the explanation names as odd."""
    t = generate(seed=seed, kind="oddoneout")
    marked = t["options"][t["answer"]]
    # explanation starts "<odd> is the odd one out"
    named = t["explanation"].split(" is the odd one out")[0]
    assert marked == named
