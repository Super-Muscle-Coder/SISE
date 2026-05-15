from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

# Hàm xây dựng cấu hình Alembic
def build_alembic_config(script_location: str, database_url: str) -> Config:
    config = Config()
    config.set_main_option("script_location", script_location)
    config.set_main_option("sqlalchemy.url", database_url)
    return config

# Hàm chạy lệnh upgrade
def run_upgrade(config: Config, revision: str) -> None:
    command.upgrade(config, revision)

# Hàm chạy lệnh downgrade
def run_downgrade(config: Config, revision: str) -> None:
    command.downgrade(config, revision)

# Hàm tạo engine kết nối PostgreSQL
def create_postgres_engine(database_url: str) -> Engine:
    return create_engine(database_url, future=True)
 