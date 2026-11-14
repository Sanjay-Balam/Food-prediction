# Food quantity forecasting (Hyderabad restaurants)

Predicts how many portions of each menu item a restaurant will sell, for tomorrow and the next 7 days,
as a **low / likely / high** range. The numbers come from LightGBM (or a same-weekday average for new items).
An LLM (Groq now, OpenAI later) only rewords the finished forecast into a prep message for the chef.

## Folder structure

```
forecast/                  prediction engine (Python package)
  app.py                   wires the classes together (the only place to change for a DB later)
  service.py               ForecastService: ingest, forecast_next_days, train_weekly
  schema.py                validates uploaded files
  store.py                 RestaurantStore interface + CSV implementation
  history.py               sales as date x item tables (closed / missing days stay unknown, not zero)
  hyderabad_calendar.py    Telangana holidays + calendar_events.csv (Ramzan, Bonalu, IPL, ...)
  features.py              model inputs; never uses sales the restaurant hasn't entered yet
  forecasters.py           LightGBM and the two baselines behind one interface
  evaluation.py            backtest on recent unseen days + value of each input
  registry.py              versioned models, live version in active.txt, rollback
  messaging.py             LLM prep message with a guard against changed numbers
  cli.py                   command line
tests/                     pytest suite
research/                  stand-in datasets, notebooks and planning docs (not used by the engine)
data/<restaurant>/         sales.csv, days.csv          (git-ignored: client data)
artifacts/<restaurant>/    trained model versions       (git-ignored)
forecasts/<restaurant>/    saved forecasts              (git-ignored)
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

## Accuracy

Accuracy = 100% − (total portions missed ÷ total portions sold), measured on recent days the model never saw.
It depends mostly on volume: an item selling ~5/day tops out near 65%, ~30/day near 85%, ~100+/day above 90%.

On the stand-in dataset (`research/datasets`, 7 dishes, 56 unseen days):

| | LightGBM | same-weekday average |
|---|---|---|
| per item per day, next day | 73.2% | 70.5% |
| daily total, next day | 85.9% | 84.9% |
| low–high range contained the actual | 83.9% | — |

Real accuracy has to be measured on each restaurant's own data: run `backtest` after ingesting it.

## Tests

```
python -m pytest tests
```
