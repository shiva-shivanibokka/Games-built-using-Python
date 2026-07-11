"""Number-sequence teaser: show terms with a hidden rule, ask for the next one."""

PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]


def _build(rng):
    """Return (terms, nxt, rule) for a randomly chosen rule. `terms` are the
    shown numbers; `nxt` is the correct next term; `rule` explains it."""
    kind = rng.choice(
        ["arithmetic", "geometric", "squares", "cubes", "fibonacci", "alternating", "prime"]
    )
    if kind == "arithmetic":
        a, d = rng.randint(1, 12), rng.randint(2, 9)
        seq = [a + d * i for i in range(6)]
        return seq[:5], seq[5], f"add {d} each step"
    if kind == "geometric":
        a, r = rng.randint(1, 4), rng.randint(2, 3)
        seq = [a * r ** i for i in range(6)]
        return seq[:5], seq[5], f"multiply by {r} each step"
    if kind == "squares":
        s = rng.randint(1, 4)
        seq = [(s + i) ** 2 for i in range(6)]
        return seq[:5], seq[5], f"perfect squares starting at {s}²"
    if kind == "cubes":
        s = rng.randint(1, 3)
        seq = [(s + i) ** 3 for i in range(5)]
        return seq[:4], seq[4], f"perfect cubes starting at {s}³"
    if kind == "fibonacci":
        a, b = rng.randint(1, 4), rng.randint(1, 5)
        seq = [a, b]
        for _ in range(4):
            seq.append(seq[-1] + seq[-2])
        return seq[:5], seq[5], "each term is the sum of the previous two"
    if kind == "alternating":
        a, x, y = rng.randint(1, 9), rng.randint(2, 6), rng.randint(2, 6)
        seq, cur = [a], a
        for i in range(6):
            cur += x if i % 2 == 0 else y
            seq.append(cur)
        return seq[:6], seq[6], f"alternately add {x} and {y}"
    # prime: add successive primes 2, 3, 5, 7, ...
    a = rng.randint(1, 9)
    seq, cur = [a], a
    for p in PRIMES[:5]:
        cur += p
        seq.append(cur)
    return seq[:5], seq[5], "add the next prime each step (2, 3, 5, 7, …)"


def generate(rng):
    terms, nxt, rule = _build(rng)
    shown = ", ".join(str(t) for t in terms)
    prompt = f"What comes next?\n{shown}, ___"

    # Distractors near the answer, all distinct from it and each other.
    offsets = [1, -1, 2, -2, 3, -3, 5, -5, terms[-1] - terms[-2] if len(terms) > 1 else 4]
    rng.shuffle(offsets)
    distract = []
    for off in offsets:
        cand = nxt + off
        if cand != nxt and cand not in distract and cand > 0:
            distract.append(cand)
        if len(distract) == 3:
            break
    while len(distract) < 3:  # ponytail: fallback if positivity trimmed too many
        cand = nxt + len(distract) + 10
        if cand != nxt and cand not in distract:
            distract.append(cand)

    opts = [nxt] + distract
    rng.shuffle(opts)
    options = [str(o) for o in opts]
    answer = options.index(str(nxt))
    return {
        "type": "sequences",
        "prompt": prompt,
        "options": options,
        "answer": answer,
        "explanation": f"The rule: {rule}. Next term is {nxt}.",
    }
