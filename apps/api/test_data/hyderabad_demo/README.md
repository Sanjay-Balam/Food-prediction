# Test data: imaginary Hyderabad biryani restaurant

**Not real sales.** Made by `python tools/generate_test_data.py` (fixed seed, so it is the same every time).
It imitates what real restaurant data looks like, so the forecast can be tested before real data arrives.

| File | What it is |
|---|---|
| `sales.csv` | 2 years of daily sales per dish, 1 Nov 2024 – 13 Nov 2026 (`date,item,qty_sold,sold_out`) |
| `sales.json` | the same rows as JSON, to test JSON upload |
| `day_info.csv` | party bookings, delivery-app promotions, closed days (`date,closed,bookings,promo`), incl. the 7 days after the data |
| `last_week_sales.csv` | the last 7 days only, for "Compare with a reference file" |

## Patterns hidden in the numbers
- **10 dishes**: Chicken / Mutton / Veg Dum Biryani, Chicken 65, Apollo Fish, Paneer Butter Masala, Butter Naan,
  Double ka Meetha, Qubani ka Meetha, and **Haleem only during Ramzan**.
- **Week**: Monday quietest, Friday lunch busy (biryani after prayers), Saturday and Sunday busiest.
- **Growth**: about +12% per year.
- **Salary days** (1st–5th of the month) a little busier.
- **Festivals** on the real Telangana dates: Eid al-Fitr very busy (+70%), Eid al-Adha and Christmas busier,
  Sankranti much quieter (people travel home), Diwali and Dussehra quieter, the evening before a holiday busier.
- **Ramzan**: biryani and desserts up (iftar dinners), Haleem 120–320 a day.
- **Seasons**: hot April–May a little slower, December busier, random rainy days in July–September slower
  (the model is not told about rain, like in real life).
- **Party bookings** add biryani, Chicken 65, naan and dessert portions; **promotions** add about 15%.
- **Mutton biryani sells out** at 100 portions and Haleem at 320 (`sold_out = yes`).
- **Closed** on 8 Jul 2025 and 3 Feb 2026 (no sales rows those days).
- Dishes that sold 0 have **no row**, as in real POS exports.
- Day-to-day noise is a bit larger than pure chance, as in real demand.

## Accuracy measured on it
- **Backtest, last 8 weeks:** LightGBM **80.3%** per item per day and **89.5%** daily total, against **77.4%**
  and **86.1%** for the same-weekday average. Bookings add about +1 point.
- **Cutoff 2026-11-06, week of 7–13 Nov:** **95.1%** weekly per item, **99.1%** weekly total, **83.4%** per item
  per day. The biggest daily miss is Diwali (8 Nov): predicted 874, actual 763, because the model had seen
  only one Diwali before.
