from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests

BASE = "https://llofficial-cardgame.com"
API_URL = BASE + "/manage/card-list-user/list"
SEARCH_URL = BASE + "/cardlist/searchresults/"
OUT = Path(__file__).resolve().parents[1] / "loveca-cards.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36 LovePokeTools/1.0",
    "Accept": "application/json,text/plain,*/*",
    "Referer": SEARCH_URL,
}
PER_PAGE = 100


def clean_value(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return value


def num_or_zero(value):
    text = str(value if value is not None else "").strip()
    if not text:
        return 0
    try:
        return int(text)
    except ValueError:
        return text


def is_live_card(raw: dict) -> bool:
    kind = str(raw.get("card_kind") or raw.get("card_kind_code") or "").strip().lower()
    return kind == "l" or "live" in kind or "ライブ" in kind


def infer_work_title(card_no: str) -> str:
    """The public list API currently omits work_title, while the official site exposes it.

    LoveCa card numbers encode the represented series, so use that stable prefix as the
    local database fallback. Cross-series LL-* cards remain grouped separately instead of
    being incorrectly assigned to one title.
    """
    no = (card_no or "").upper()
    prefix_map = (
        ("PL!SP-", "ラブライブ！スーパースター!!"),
        ("PL!HS-", "ラブライブ！蓮ノ空女学院スクールアイドルクラブ"),
        ("PL!N-", "ラブライブ！虹ヶ咲学園スクールアイドル同好会"),
        ("PL!S-", "ラブライブ！サンシャイン!!"),
        ("PL!-", "ラブライブ！"),
        ("IKZL-", "イキヅライブ！ LOVELIVE! BLUEBIRD"),
        ("LL-", "ラブライブ！シリーズ（複数作品）"),
    )
    for prefix, title in prefix_map:
        if no.startswith(prefix):
            return title
    return ""


def normalize_card(raw: dict) -> dict:
    card_id = raw.get("id")
    card_no = clean_value(raw.get("card_number"))
    picture = clean_value(raw.get("picture"))
    image_url = urljoin(BASE + "/wordpress/wp-content/images/cardlist/", picture) if picture else ""
    detail_url = f"{BASE}/cardlist/detail/?id={card_id}" if card_id not in (None, "") else ""
    live = is_live_card(raw)

    hearts = {
        "pink": num_or_zero(raw.get("heart01")),
        "red": num_or_zero(raw.get("heart02")),
        "yellow": num_or_zero(raw.get("heart03")),
        "green": num_or_zero(raw.get("heart04")),
        "blue": num_or_zero(raw.get("heart05")),
        "purple": num_or_zero(raw.get("heart06")),
        "colorless": num_or_zero(raw.get("heart0")),
    }

    api_work = clean_value(raw.get("work_title") or raw.get("work"))
    work = api_work or infer_work_title(card_no)

    return {
        "id": str(card_id if card_id is not None else card_no),
        "cardNo": card_no,
        "name": clean_value(raw.get("card_name")),
        "cardType": clean_value(raw.get("card_kind") or raw.get("kind")),
        "cardTypeSub": clean_value(raw.get("card_kind_sub") or raw.get("kind_sub")),
        "isLive": live,
        "expansion": clean_value(raw.get("expansion_name") or raw.get("expansion")),
        "text": clean_value(raw.get("text")),
        "imageUrl": image_url,
        "detailUrl": detail_url,
        "cost": clean_value(raw.get("cost")),
        "score": clean_value(raw.get("blade_heart")) if live else "",
        "hearts": hearts,
        "heartText": clean_value(raw.get("heart")),
        "bladeHeart": clean_value(raw.get("blade") or raw.get("attack")) if live else clean_value(raw.get("blade_heart")),
        "specialHeart": clean_value(raw.get("cost")) if live else "",
        "rarity": clean_value(raw.get("rare")),
        "work": work,
        "unit": clean_value(raw.get("unit_name") or raw.get("unit")),
        "color": clean_value(raw.get("color")),
        "power": clean_value(raw.get("power")),
        "attack": clean_value(raw.get("attack")),
        "picture": picture,
    }


def fetch_page(session: requests.Session, page: int) -> dict:
    params = {
        "page": page,
        "per_page": PER_PAGE,
        "sort": "no",
        "parallel": "all",
    }
    response = session.get(API_URL, params=params, headers=HEADERS, timeout=60)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected API response type: {type(data).__name__}")
    return data


def main():
    session = requests.Session()
    cards = []
    seen_ids = set()
    page = 1
    total = None

    while True:
        data = fetch_page(session, page)
        items = data.get("items") or []
        if total is None:
            total = data.get("total")
            print(f"official API total: {total}")

        print(f"page {page}: {len(items)} cards")
        if not items:
            break

        for raw in items:
            key = str(raw.get("id") if raw.get("id") is not None else raw.get("card_number"))
            if key in seen_ids:
                continue
            seen_ids.add(key)
            cards.append(normalize_card(raw))

        if len(items) < PER_PAGE:
            break
        if total is not None and len(cards) >= int(total):
            break
        page += 1
        time.sleep(0.15)

    if len(cards) < 100:
        raise SystemExit(f"Official API returned too few cards: {len(cards)}")

    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": API_URL,
        "total": len(cards),
        "cards": cards,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} with {len(cards)} cards ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
