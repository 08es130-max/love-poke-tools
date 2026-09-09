#!/usr/bin/env python3
"""Guard the resolved mascot implementation against merge regressions."""

from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MASCOT_FILES = (ROOT / "mascot.js", ROOT / "mascot.css")
CONFLICT_MARKERS = ("<<<<<<<", "=======", ">>>>>>>")


def require(source: str, fragment: str, label: str) -> None:
    if fragment not in source:
        raise SystemExit(f"missing {label}: {fragment}")


def main() -> None:
    for path in MASCOT_FILES:
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if line.startswith(CONFLICT_MARKERS):
                raise SystemExit(f"unresolved conflict marker: {path.name}:{line_number}")

    javascript = MASCOT_FILES[0].read_text(encoding="utf-8")
    stylesheet = MASCOT_FILES[1].read_text(encoding="utf-8")

    require(javascript, "const INSTANCE_KEY", "singleton guard")
    require(javascript, "removeDuplicateRoots", "duplicate-root cleanup")
    require(javascript, "shioriko-sprite-fixed.png", "fixed sprite path")
    require(javascript, "frameWidth: 272", "sprite frame width")
    require(javascript, "frameHeight: 217", "sprite frame height")
    require(javascript, "columns: 4", "sprite columns")
    require(javascript, "rows: 5", "sprite rows")
    require(
        javascript,
        "right: 0, left: 1, down: 2, up: 3, idle: 4",
        "direction row mapping",
    )
    require(stylesheet, "shioriko-sprite-fixed.png", "CSS sprite path")
    require(stylesheet, "background-repeat: no-repeat", "non-repeating sprite")
    require(stylesheet, "overflow: hidden", "single-frame clipping")
    require(
        stylesheet,
        "background-position: var(--mascot-frame-x) var(--mascot-frame-y)",
        "calculated frame position",
    )

    print("mascot conflict markers: 0; singleton and sprite invariants: OK")


if __name__ == "__main__":
    main()
