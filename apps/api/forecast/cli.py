"""Command line: python -m forecast.cli <command> --restaurant <id>

  nightly      upload today's sales (+ optional day info), forecast tomorrow, chef message   every night
  ingest       add or correct sales from a CSV (date,item,qty_sold[,sold_out])
  ingest-days  add or correct day info from a CSV (date,closed,bookings,promo); future dates allowed
  predict      forecast the next days (default 7) with the live model
  message      prep message for the first forecast day (LLM wording, LightGBM numbers)
  train        backtest, retrain, and go live only if better                                 once a week
  backtest     accuracy on recent unseen days (--gain: what each input is worth)
"""
import argparse
import sys

import pandas as pd

from .app import create_forecast_service, create_message_writer
from .config import Settings
from .service import ForecastService


def print_accuracy_report(report: dict):
    for days_ahead, result in report.items():
        horizon = "next day" if days_ahead == 1 else f"up to {days_ahead} days ahead"
        print(f"\n== Accuracy, forecast {horizon} ({result['test_days']} unseen days) ==")
        rows = {name: {"per item per day": m["item_day_accuracy"], "daily total": m["daily_total_accuracy"],
                       **m["accuracy_by_volume"]} for name, m in result["methods"].items()}
        print(pd.DataFrame(rows).T.to_string())
        if "range_hit_rate" in result:
            print(f"low-high range contained the actual sales on {result['range_hit_rate']}% of item-days "
                  f"(target ~80%)")
    first = next(iter(report.values()))
    by_item = pd.DataFrame({name: m["accuracy_by_item"] for name, m in first["methods"].items()})
    by_item.insert(0, "avg sold/day", pd.Series(first["avg_sold_per_day"]))
    print("\nPer item, next day:\n" + by_item.sort_values("avg sold/day", ascending=False).to_string())


def print_forecast(forecast: pd.DataFrame, rid: str):
    print(forecast.pivot_table(index="item", columns="date", values="likely", aggfunc="first").to_string())
    print(f"\nmodel: {forecast['model_version'].iloc[0]} | sales data until {forecast['data_until'].iloc[0]} | "
          f"saved with low/high ranges to forecasts/{rid}/{forecast['date'].min()}.csv")


def print_prep_message(forecast: pd.DataFrame, language: str, settings: Settings | None):
    _, text, source = create_message_writer(settings).write_for_next_day(forecast, language)
    print(f"{text}\n\n[{source}]")


def run_ingest(service: ForecastService, args):
    print(service.ingest_sales_file(args.restaurant, args.file))


def run_ingest_days(service: ForecastService, args):
    print(service.ingest_days_file(args.restaurant, args.file))


def run_train(service: ForecastService, args):
    result = service.train_weekly(args.restaurant, args.weeks)
    print_accuracy_report(result.report)
    status = "LIVE" if result.activated else "saved, not live"
    print(f"\nmodel version {result.version}: {status} - {result.reason}")


def run_backtest(service: ForecastService, args):
    history = service.load_history(args.restaurant)
    print_accuracy_report(service.backtester.evaluate(history, args.weeks))
    if args.gain:
        with_all, value_of = service.backtester.measure_input_value(history, args.weeks)
        print(f"\nWhat each input is worth (next day, {with_all}% with all inputs; points lost without it):")
        for group, points in sorted(value_of.items(), key=lambda pair: -pair[1]):
            print(f"  {group:18} {points:+.1f}  {'keep' if points > 0 else 'no gain on this data'}")


def run_predict(service: ForecastService, args):
    print_forecast(service.forecast_next_days(args.restaurant, args.days), args.restaurant)


def run_message(service: ForecastService, args):
    forecast = service.store.latest_forecast(args.restaurant)
    if forecast is None:
        sys.exit("no forecast yet: run predict first")
    print_prep_message(forecast, args.language, args.settings)


def run_nightly(service: ForecastService, args):
    """The whole nightly routine in one step. No training: that stays weekly."""
    print("1. sales uploaded:", service.ingest_sales_file(args.restaurant, args.sales_file))
    if args.days_file:
        print("   day info uploaded:", service.ingest_days_file(args.restaurant, args.days_file))
    print("\n2. forecast:")
    forecast = service.forecast_next_days(args.restaurant, args.days)
    print_forecast(forecast, args.restaurant)
    print("\n3. chef message:")
    print_prep_message(forecast, args.language, args.settings)


COMMANDS = {"nightly": run_nightly, "ingest": run_ingest, "ingest-days": run_ingest_days, "train": run_train,
            "backtest": run_backtest, "predict": run_predict, "message": run_message}


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="python -m forecast.cli", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="command", required=True)
    sub = {name: commands.add_parser(name) for name in COMMANDS}
    for command in sub.values():
        command.add_argument("--restaurant", "-r", required=True)
    sub["ingest"].add_argument("file")
    sub["ingest-days"].add_argument("file")
    sub["train"].add_argument("--weeks", type=int, default=None)
    sub["backtest"].add_argument("--weeks", type=int, default=None)
    sub["backtest"].add_argument("--gain", action="store_true", help="also measure what each input is worth")
    sub["predict"].add_argument("--days", type=int, default=7)
    sub["nightly"].add_argument("sales_file")
    sub["nightly"].add_argument("--days-file", help="optional day info CSV (bookings, promo, closed)")
    sub["nightly"].add_argument("--days", type=int, default=1, help="days to forecast (default: tomorrow only)")
    for name in ("message", "nightly"):
        sub[name].add_argument("--language", default="English", help="e.g. English, Hinglish, Telugu")
    return parser.parse_args(argv)


def main(argv=None, settings: Settings | None = None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows console fails on LLM unicode
    args = parse_args(argv)
    args.settings = settings
    COMMANDS[args.command](create_forecast_service(settings), args)


if __name__ == "__main__":
    main()
