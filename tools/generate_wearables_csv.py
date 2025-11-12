#!/usr/bin/env python3
"""
generate_wearables_csv.py
-------------------------

Utility script to synthesize large CSV datasets for wearable readings.
The default output matches the format required by add_wearable.php:

    date,steps,hrv,resting_hr
    2025-11-01,8250,74,60
    ...

Usage:
    python tools/generate_wearables_csv.py --rows 10000000 --out data/wearables_10m.csv
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from datetime import date, timedelta
from typing import Iterator, Tuple


def iter_rows(start: date, rows: int, seed: int | None, cycle_days: int) -> Iterator[Tuple[str, int, int, int]]:
    rnd = random.Random(seed)
    current = start
    for _ in range(rows):
        steps = rnd.randint(3000, 15000)
        hrv = rnd.randint(60, 95)
        resting = rnd.randint(50, 65)
        yield current.isoformat(), steps, hrv, resting
        current += timedelta(days=1)
        if cycle_days and (current - start).days >= cycle_days:
            current = start


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate large wearable CSV datasets.")
    parser.add_argument(
        "--rows",
        type=int,
        default=10_000_000,
        help="Number of rows to generate (default: 10,000,000)",
    )
    parser.add_argument(
        "--out",
        type=str,
        default="data/wearables_dataset.csv",
        help="Output CSV path (default: data/wearables_dataset.csv)",
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default="2025-11-01",
        help="Starting date in YYYY-MM-DD (default: 2025-11-01)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)",
    )
    parser.add_argument(
        "--cycle-days",
        type=int,
        default=365,
        help="Number of days before dates loop back to start (prevents overflow). Set 0 to disable (default: 365)",
    )
    args = parser.parse_args()

    start = date.fromisoformat(args.start_date)
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)

    with open(args.out, "w", newline="", buffering=1024 * 1024) as fh:
        writer = csv.writer(fh)
        writer.writerow(["date", "steps", "hrv", "resting_hr"])
        for idx, row in enumerate(iter_rows(start, args.rows, args.seed, args.cycle_days), 1):
            writer.writerow(row)
            if idx % 1_000_000 == 0:
                print(f"Wrote {idx:,} rows…")

    print(f"Done. Wrote {args.rows:,} rows to {args.out}")


if __name__ == "__main__":
    main()
