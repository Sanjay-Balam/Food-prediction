"""
Generates 1 full year (365 days) of realistic daily POS sales for an authentic Hyderabad restaurant.
Output schema matches apps/api: date,item,qty_sold,sold_out
Covers 2025-11-15 to 2026-11-14.
"""
import csv
import datetime
import math
import random

random.seed(42)

# Start and end dates for 1 full year
start_date = datetime.date(2025, 11, 15)
end_date = datetime.date(2026, 11, 14)
delta = (end_date - start_date).days + 1  # 365 days

items_config = [
    {"name": "Chicken Dum Biryani", "base": 190, "weekend_mult": 1.45, "friday_mult": 1.35, "std": 18},
    {"name": "Mutton Dum Biryani", "base": 95, "weekend_mult": 1.55, "friday_mult": 1.40, "std": 12},
    {"name": "Veg Biryani", "base": 48, "weekend_mult": 1.25, "friday_mult": 1.15, "std": 8},
    {"name": "Chicken 65", "base": 88, "weekend_mult": 1.40, "friday_mult": 1.25, "std": 10},
    {"name": "Apollo Fish", "base": 42, "weekend_mult": 1.35, "friday_mult": 1.20, "std": 6},
    {"name": "Paneer Butter Masala", "base": 58, "weekend_mult": 1.30, "friday_mult": 1.15, "std": 8},
    {"name": "Butter Naan", "base": 240, "weekend_mult": 1.40, "friday_mult": 1.25, "std": 22},
    {"name": "Double ka Meetha", "base": 54, "weekend_mult": 1.50, "friday_mult": 1.30, "std": 8},
    {"name": "Qubani ka Meetha", "base": 38, "weekend_mult": 1.45, "friday_mult": 1.25, "std": 6},
    {"name": "Special Royal Haleem", "base": 0, "weekend_mult": 1.4, "friday_mult": 1.3, "std": 12, "seasonal": True},
]

# Ramzan in 2026: ~Feb 18 to Mar 20
ramzan_start = datetime.date(2026, 2, 18)
ramzan_end = datetime.date(2026, 3, 20)

rows = []

current = start_date
while current <= end_date:
    date_str = current.strftime("%Y-%m-%d")
    weekday = current.weekday()  # 0=Monday, 4=Friday, 5=Saturday, 6=Sunday
    is_friday = (weekday == 4)
    is_saturday = (weekday == 5)
    is_sunday = (weekday == 6)
    is_weekend = is_saturday or is_sunday

    # Day multiplier
    day_mult = 1.0
    if is_friday:
        day_mult = 1.25
    elif is_saturday:
        day_mult = 1.42
    elif is_sunday:
        day_mult = 1.38
    elif weekday == 0:  # Monday quiet day
        day_mult = 0.85

    # Seasonality (cooler months Nov-Jan +10%, peak summer May -5% dine-in / +10% delivery)
    month = current.month
    if month in (11, 12, 1):
        season_mult = 1.10
    elif month in (5, 6):
        season_mult = 0.95
    else:
        season_mult = 1.00

    # Ramzan check
    in_ramzan = (ramzan_start <= current <= ramzan_end)

    for item in items_config:
        name = item["name"]

        # Seasonal item handling (Haleem)
        if item.get("seasonal"):
            if in_ramzan:
                base_haleem = 110
                h_mult = 1.35 if is_weekend else 1.0
                qty = int(random.gauss(base_haleem * h_mult, 14))
                qty = max(25, qty)
                # Haleem often sells out
                sold_out = "yes" if (is_weekend and random.random() < 0.25) else "no"
                rows.append({"date": date_str, "item": name, "qty_sold": qty, "sold_out": sold_out})
            continue

        base = item["base"]
        if is_friday:
            item_factor = item["friday_mult"]
        elif is_weekend:
            item_factor = item["weekend_mult"]
        else:
            item_factor = 1.0

        target = base * item_factor * season_mult * (day_mult / (1.35 if is_weekend else 1.0))
        noise = random.gauss(0, item["std"])
        qty = max(5, int(round(target + noise)))

        # Realistic stockout / sold out
        # Mutton biryani runs out on Saturday/Sunday peak evenings 12% of the time
        sold_out = "no"
        if name == "Mutton Dum Biryani" and is_weekend and random.random() < 0.12:
            sold_out = "yes"
        elif name == "Apollo Fish" and is_friday and random.random() < 0.08:
            sold_out = "yes"

        rows.append({
            "date": date_str,
            "item": name,
            "qty_sold": qty,
            "sold_out": sold_out,
        })

    current += datetime.timedelta(days=1)

# Write to root
output_path_root = r"c:\projects\food-predection\test_sales_hyderabad_1year.csv"
with open(output_path_root, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["date", "item", "qty_sold", "sold_out"])
    writer.writeheader()
    writer.writerows(rows)

# Also write to public folder of demo-web so user can download directly
output_path_public = r"c:\projects\food-predection\apps\demo-web\public\test_sales_hyderabad_1year.csv"
with open(output_path_public, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["date", "item", "qty_sold", "sold_out"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Successfully generated {len(rows)} sales records across {delta} days.")
print(f"Saved to: {output_path_root}")
print(f"Saved to: {output_path_public}")
