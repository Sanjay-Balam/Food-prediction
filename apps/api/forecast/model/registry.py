"""Versioned models on disk: artifacts/<restaurant>/<version>/ plus active.txt naming the version in use.
Keeping old versions makes rollback a one-line change to active.txt."""
import json
import shutil
from datetime import datetime
from pathlib import Path

from ..data import schema
from .forecasters import LightGBMForecaster


class ModelRegistry:
    def __init__(self, artifacts_dir: Path, versions_to_keep: int):
        self.artifacts_dir, self.versions_to_keep = Path(artifacts_dir), versions_to_keep

    def _restaurant_folder(self, restaurant_id: str) -> Path:
        return self.artifacts_dir / schema.validate_restaurant_id(restaurant_id)

    def active_version(self, restaurant_id: str) -> tuple[str | None, dict | None]:
        """(version name, its info.json) or (None, None) when nothing has been activated yet."""
        marker = self._restaurant_folder(restaurant_id) / "active.txt"
        if not marker.exists():
            return None, None
        version = marker.read_text().strip()
        return version, json.loads((self._restaurant_folder(restaurant_id) / version / "info.json").read_text())

    def save_new_version(self, restaurant_id: str, models_by_horizon: dict[int, LightGBMForecaster], info: dict) -> str:
        version = datetime.now().strftime("%Y%m%d-%H%M%S")
        folder = self._restaurant_folder(restaurant_id) / version
        folder.mkdir(parents=True)
        for days_ahead, model in models_by_horizon.items():
            model.save(folder, f"h{days_ahead}")
        info = info | {"version": version,
                       "feature_columns": {str(h): m.feature_columns for h, m in models_by_horizon.items()}}
        (folder / "info.json").write_text(json.dumps(info, indent=2))
        return version

    def activate(self, restaurant_id: str, version: str):
        (self._restaurant_folder(restaurant_id) / "active.txt").write_text(version)

    def load_active_models(self, restaurant_id: str) -> tuple[str | None, dict[int, LightGBMForecaster]]:
        version, info = self.active_version(restaurant_id)
        if version is None:
            return None, {}
        folder = self._restaurant_folder(restaurant_id) / version
        return version, {int(h): LightGBMForecaster.load(folder, f"h{h}", columns)
                         for h, columns in info["feature_columns"].items()}

    def delete_old_versions(self, restaurant_id: str):
        active, _ = self.active_version(restaurant_id)
        versions = sorted(path for path in self._restaurant_folder(restaurant_id).iterdir() if path.is_dir())
        for old in versions[:-self.versions_to_keep]:
            if old.name != active:
                shutil.rmtree(old)
