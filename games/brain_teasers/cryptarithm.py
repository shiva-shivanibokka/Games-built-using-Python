"""Cryptarithm teaser: WORD1 + WORD2 = WORD3 with a unique digit mapping.

Built by adding two numbers, mapping each distinct digit to a letter, then
keeping only puzzles whose mapping is the *only* valid solution — so the asked
digit is provably correct.
"""

LETTER_POOL = "ABCDEFGHJKLMNPRSTUVWXYZ"  # no I/O to avoid digit look-alikes


def solve(w1, w2, w3, cap=2):
    """All solutions (up to `cap`) of w1+w2=w3 with distinct digits per letter
    and no leading zeros. Column-carry backtracking — fast even at 2 solutions."""
    n = len(w3)
    if len(w1) > n or len(w2) > n:
        return []
    leads = {w1[0], w2[0], w3[0]}
    cols = [
        (
            w1[-1 - i] if i < len(w1) else None,
            w2[-1 - i] if i < len(w2) else None,
            w3[-1 - i],
        )
        for i in range(n)
    ]
    sols, assign, used = [], {}, [False] * 10

    def rec(col, carry):
        if len(sols) >= cap:
            return
        if col == n:
            if carry == 0:
                sols.append(dict(assign))
            return
        a, b, c = cols[col]

        def opts(letter):
            if letter is None:
                return [0]
            if letter in assign:
                return [assign[letter]]
            return [d for d in range(10) if not used[d]]

        for da in opts(a):
            addA = a is not None and a not in assign
            if addA:
                if da == 0 and a in leads:
                    continue
                assign[a], used[da] = da, True
            for db in opts(b):
                addB = b is not None and b not in assign
                if addB:
                    if (db == 0 and b in leads) or used[db]:
                        continue
                    assign[b], used[db] = db, True
                s = da + db + carry
                cd, co = s % 10, s // 10
                addC = False
                ok = True
                if c in assign:
                    ok = assign[c] == cd
                elif used[cd] or (cd == 0 and c in leads):
                    ok = False
                else:
                    assign[c], used[cd], addC = cd, True, True
                if ok:
                    rec(col + 1, co)
                if addC:
                    used[assign[c]] = False
                    del assign[c]
                if addB:
                    used[assign[b]] = False
                    del assign[b]
                if len(sols) >= cap:
                    break
            if addA:
                used[assign[a]] = False
                del assign[a]
            if len(sols) >= cap:
                return

    rec(0, 0)
    return sols


# Verified-unique fallback (88 + 12 = 100) for the rare seed where search fails.
_FALLBACK = ("HH", "JU", "JSS", 88, 12, 100, {"H": 8, "U": 2, "S": 0, "J": 1})


def _make(rng):
    for _ in range(500):
        a, b = rng.randint(11, 99), rng.randint(11, 99)
        c = a + b
        digs = sorted(set(str(a) + str(b) + str(c)))
        if len(digs) > 7:
            continue
        letters = rng.sample(LETTER_POOL, len(digs))
        d2l = dict(zip(digs, letters))
        w1 = "".join(d2l[d] for d in str(a))
        w2 = "".join(d2l[d] for d in str(b))
        w3 = "".join(d2l[d] for d in str(c))
        sols = solve(w1, w2, w3)
        if len(sols) == 1:
            return (w1, w2, w3, a, b, c, sols[0])
    return _FALLBACK


def generate(rng):
    w1, w2, w3, a, b, c, mapping = _make(rng)
    target = rng.choice(sorted(mapping))
    ans = mapping[target]

    distract = [d for d in range(10) if d != ans]
    rng.shuffle(distract)
    opts = [ans] + distract[:3]
    rng.shuffle(opts)
    options = [str(o) for o in opts]
    answer = options.index(str(ans))

    full = ", ".join(f"{k}={v}" for k, v in sorted(mapping.items()))
    return {
        "type": "cryptarithm",
        "prompt": f"Each letter is a distinct digit (no leading zeros):\n"
        f"{w1} + {w2} = {w3}\nWhat digit is {target}?",
        "options": options,
        "answer": answer,
        "explanation": f"{a} + {b} = {c}, so {target} = {ans}.  Mapping: {full}.",
    }
