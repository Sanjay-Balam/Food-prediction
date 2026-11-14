# Predict 19–25 June 2026 (test data, not real sales)

Postman folder **"5. Predict 19-25 June"** uses these files (restaurant `{{juneTestRestaurantId}}` = `hyd_june_test`):

| File | Use |
|---|---|
| `sales_until_2026-06-18.csv` | **1. Upload sales**: all sales up to 18 June, in one file |
| `week_2026-06-19_to_2026-06-25.csv` | **4 / 5. Compare**: the real 19–25 June sales (not saved, only compared) |

Steps: **1** upload → **2** train → **3** forecast 19–25 June → **4** compare per day → **5** compare per week.

Expected results (measured):

| | Accuracy |
|---|---|
| Per dish, per day | 84.3% |
| Whole restaurant, per day | 93.3% |
| Per dish, week total | 96.1% |
| Whole restaurant, week total | 97.2% (predicted 4,444 vs actual 4,322) |

The other files (`sales_until_2026-06-10.csv`, `2026-06-11.csv` … `2026-06-18.csv`) are single days, if you ever
want to upload day by day with the normal *Upload sales* request.
