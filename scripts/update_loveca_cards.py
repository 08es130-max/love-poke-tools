from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = "https://llofficial-cardgame.com"
SEARCH_URL = BASE + "/cardlist/searchresults/?parallel=all&sort=new&view=text"
OUT = Path(__file__).resolve().parents[1] / "loveca-cards.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36 LovePokeTools/1.0"
}


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def find_card_container(label_node):
    node = label_node
    best = None
    for _ in range(8):
        node = getattr(node, "parent", None)
        if node is None:
            break
        text = clean(node.get_text(" ", strip=True))
        if "カード番号" in text and "カードタイプ" in text and "収録商品" in text:
            best = node
            links = node.find_all("a", href=True)
            if any("詳しく" in clean(a.get_text(" ", strip=True)) for a in links):
                return node
    return best


def extract_after_label(container, label: str) -> str:
    strings = [clean(x) for x in container.stripped_strings]
    try:
        i = strings.index(label)
    except ValueError:
        return ""
    return strings[i + 1] if i + 1 < len(strings) else ""


def parse_cards(html: str):
    soup = BeautifulSoup(html, "html.parser")
    containers = []
    seen = set()
    for text_node in soup.find_all(string=lambda s: s and clean(s) == "カード番号"):
        container = find_card_container(text_node)
        if container is not None and id(container) not in seen:
            seen.add(id(container))
            containers.append(container)

    cards = []
    seen_numbers = set()
    for container in containers:
        card_no = extract_after_label(container, "カード番号")
        if not card_no or card_no in seen_numbers:
            continue
        seen_numbers.add(card_no)
        expansion = extract_after_label(container, "収録商品")
        card_type = extract_after_label(container, "カードタイプ")

        detail_link = None
        for a in container.find_all("a", href=True):
            if "詳しく" in clean(a.get_text(" ", strip=True)):
                detail_link = urljoin(BASE, a["href"])
                break

        img = container.find("img")
        image_url = urljoin(BASE, img.get("src")) if img and img.get("src") else ""
        image_alt = clean(img.get("alt", "")) if img else ""

        strings = [clean(x) for x in container.stripped_strings]
        excluded = {"収録商品", "カードタイプ", "カード番号", expansion, card_type, card_no, "詳しく見る"}
        candidates = [s for s in strings if s and s not in excluded and not s.startswith("検索結果")]
        name = image_alt or (candidates[0] if candidates else card_no)

        text_parts = []
        for s in candidates:
            if s == name:
                continue
            if s not in text_parts:
                text_parts.append(s)
        effect_text = " ".join(text_parts)

        cards.append({
            "id": card_no,
            "cardNo": card_no,
            "name": name,
            "cardType": card_type,
            "expansion": expansion,
            "text": effect_text,
            "imageUrl": image_url,
            "detailUrl": detail_link or "",
            "cost": None,
            "score": None,
            "hearts": {},
            "rarity": "",
            "work": "",
            "unit": ""
        })
    return cards


def main():
    response = requests.get(SEARCH_URL, headers=HEADERS, timeout=45)
    response.raise_for_status()
    cards = parse_cards(response.text)
    print(f"parsed cards: {len(cards)}")
    if len(cards) < 100:
        Path("loveca-cardlist-debug.html").write_text(response.text, encoding="utf-8")
        raise SystemExit("Card parsing returned too few cards; saved loveca-cardlist-debug.html for inspection.")

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": SEARCH_URL,
        "cards": cards,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
