"""Composition root: the one place that wires concrete classes together. Swapping CSV storage for a
database later means changing only create_forecast_service()."""
from .hyderabad_calendar import EventCalendar
from .config import Settings
from .evaluation import Backtester
from .features import FeatureBuilder
from .messaging import LLMConfig, OpenAICompatibleClient, PrepMessageWriter
from .registry import ModelRegistry
from .service import ForecastService
from .store import CsvRestaurantStore


def create_forecast_service(settings: Settings | None = None) -> ForecastService:
    settings = settings or Settings()
    feature_builder = FeatureBuilder(EventCalendar())
    return ForecastService(
        store=CsvRestaurantStore(settings.data_dir, settings.forecasts_dir),
        registry=ModelRegistry(settings.artifacts_dir, settings.keep_versions),
        feature_builder=feature_builder,
        backtester=Backtester(feature_builder, settings),
        settings=settings,
    )


def create_message_writer(settings: Settings | None = None) -> PrepMessageWriter:
    config = LLMConfig.from_environment((settings or Settings()).env_file)
    return PrepMessageWriter(OpenAICompatibleClient(config) if config else None)
