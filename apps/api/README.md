# Food quantity forecasting (Hyderabad restaurants)

Predicts how many portions of each menu item a restaurant will sell, for tomorrow and the next 7 days,
as a **low / likely / high** range. The numbers come from LightGBM (or a same-weekday average for new items).
An LLM (Groq now, OpenAI later) only rewords the finished forecast into a prep message for the chef.

This is `apps/api` in the monorepo (see the root README). Run every command below **inside `apps/api`**,
or start it together with the web app from the repo root with `pnpm dev`.

## Folder structure

```
forecast/                      prediction engine (Python package)
  api.py                       entry point: HTTP API (FastAPI)
  cli.py                       entry point: command line
  app.py                       wires the classes together (the only place to change for a DB later)
  config.py                    all paths and tuning values
  service.py                   ForecastService: the one facade both entry points call
  messaging.py                 chef prep message (LLM), with a guard against changed numbers
  data/                        incoming data
    schema.py                  validates uploaded files (the trust boundary)
    store.py                   RestaurantStore interface + CSV implementation
    history.py                 sales as date x item tables (closed / missing days stay unknown, not zero)
  model/                       machine learning
    features.py                model inputs; never uses sales the restaurant hasn't entered yet
    forecasters.py             LightGBM and the two baselines behind one interface
    registry.py                versioned models, live version in active.txt, rollback
    hyderabad_calendar.py      Telangana holidays + calendar_events.csv (Ramzan, Bonalu, IPL, ...)
  evaluation/                  accuracy
    backtest.py                rolling backtest on recent unseen days + value of each input
    comparison.py              a forecast vs real sales, per day or per week
postman/                       Postman collection (import it) + sample files
test_data/hyderabad_demo/      realistic TEST data of an imaginary Hyderabad restaurant (see its README)
tools/generate_test_data.py    recreates that test data
tests/                         pytest suite (sample_data.py = shared synthetic sales)
package.json                   lets Turborepo run this app: `dev` (uvicorn) and `test` (pytest)
data/<restaurant>/             sales.csv, days.csv          (git-ignored: client data)
artifacts/<restaurant>/        trained model versions       (git-ignored)
forecasts/<restaurant>/        saved forecasts              (git-ignored)
```

## Setup

```
python -m pip install -r requirements.txt
copy .env.example .env      # then fill in LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
```

## Input files

`data/<restaurant>/sales.csv`, added to daily with `ingest`:

| column | example | notes |
|---|---|---|
| date | 2026-11-14 | YYYY-MM-DD only |
| item | Chicken Biryani | |
| qty_sold | 185 | whole number |
| sold_out | yes / no | optional; sold-out days are not treated as true demand |
| category | Starters | optional menu section; adds accuracy per category to `/compare` |

`data/<restaurant>/days.csv`, optional, added to with `ingest-days`. Future dates are allowed, e.g. a party booked for next Friday:

| column | example | notes |
|---|---|---|
| date | 2026-11-20 | YYYY-MM-DD only |
| closed | yes / no | closed or partial day: not learned as low demand |
| bookings | 80 | expected covers / party-order portions |
| promo | yes / no | e.g. Swiggy/Zomato offer that day |

Re-uploading a date replaces that whole row. The model starts using bookings and promotions at the next weekly
`train`, and they only help once a few weeks of them have been recorded. `backtest --gain` shows how much.

## Daily and weekly routine

```
# every night, after the restaurant enters the day's sales (no training): upload, forecast tomorrow, chef message
python -m forecast.cli nightly  -r rest1 today.csv --days-file day_info.csv --language Hinglish

# the same steps one by one
python -m forecast.cli ingest       -r rest1 today.csv
python -m forecast.cli ingest-days  -r rest1 day_info.csv
python -m forecast.cli predict      -r rest1 --days 7
python -m forecast.cli message      -r rest1 --language Hinglish

# once a week: backtest, retrain, go live only if it beats the baseline
python -m forecast.cli train    -r rest1

# any time: accuracy report, and what each input is worth
python -m forecast.cli backtest -r rest1 --gain
```

## API (FastAPI, for Postman)

```
python -m uvicorn forecast.api:app --reload
```
**Postman:** Import → Files → `postman/Food-Forecast-API.postman_collection.json`. It has every endpoint in
run order (upload → train → forecast → compare → nightly), the test files already attached, a status check on
each request, and its own readme in the collection's Docs tab. You can also try the API in the browser at
http://127.0.0.1:8000/docs.

| Method | Endpoint | Does |
|---|---|---|
| POST | `/restaurants/{id}/sales/upload` | upload sales as `.csv` or `.json` (other file types are rejected) |
| POST | `/restaurants/{id}/days/upload` | upload bookings / promo / closed days as `.csv` or `.json` |
| POST | `/restaurants/{id}/train?weeks=8&until=YYYY-MM-DD` | weekly training (~40 s); `until` = test mode, train only up to that day |
| POST | `/restaurants/{id}/forecast?days=7&until=YYYY-MM-DD` | low / likely / high per item, for the days after `until` (or after the last upload) |
| POST | `/restaurants/{id}/compare?period=day` or `week` | latest forecast vs real sales: the uploaded sales, or an optional reference file (not saved); `prep_styles` splits accuracy into batch-prep dishes (averaged `batch_prep_min_daily_portions`+ a day before the cutoff, judged per dish per day) and cook-to-order dishes |
| GET | `/restaurants/{id}/backtest?weeks=8` | accuracy on recent unseen weeks |
| POST | `/restaurants/{id}/message?language=Hinglish` | chef prep message |

JSON uploads are a list of rows: `[{"date": "2026-11-14", "item": "Chicken Biryani", "qty_sold": 182, "sold_out": "no", "category": "Biryani"}]`
(see `postman/sample_files/sales_example.json`).

**Hold-out test with your own data:** upload all real sales once → `train?until=<cutoff>` →
`forecast?days=7&until=<cutoff>` → `compare?period=week` (and `day`). The days after the cutoff are the hidden
test, so no file splitting is needed. If the live model was trained on days after the cutoff, `forecast`
refuses, because that test would not be fair.

No login yet: keep the server on 127.0.0.1 (the default) until authentication is added.

## Accuracy

Accuracy = 100% − (total portions missed ÷ total portions sold), measured on recent days the model never saw.
It depends mostly on volume: an item selling ~5/day tops out near 65%, ~30/day near 85%, ~100+/day above 90%.

On the stand-in dataset (`research/datasets` at the repo root, 7 dishes, 56 unseen days):

| | LightGBM | same-weekday average |
|---|---|---|
| per item per day, next day | 73.2% | 70.5% |
| daily total, next day | 85.9% | 84.9% |
| low–high range contained the actual | 83.9% | — |

Real accuracy has to be measured on each restaurant's own data: run `backtest` after ingesting it.

## Tests

```
pytest
```
