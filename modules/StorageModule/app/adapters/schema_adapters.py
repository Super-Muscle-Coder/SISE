from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


def build_alembic_config(script_location: str, database_url: str) -> Config:
    config = Config()
    config.set_main_option("script_location", script_location)
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def run_upgrade(config: Config, revision: str) -> None:
    command.upgrade(config, revision)


def run_downgrade(config: Config, revision: str) -> None:
    command.downgrade(config, revision)


def create_postgres_engine(database_url: str) -> Engine:
    return create_engine(database_url, future=True)
 