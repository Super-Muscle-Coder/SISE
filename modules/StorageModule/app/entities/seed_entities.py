from dataclasses import dataclass


@dataclass(frozen=True)
class SeedConfig:
    user_count: int
    album_count: int
    image_count: int
