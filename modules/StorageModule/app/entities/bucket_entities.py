from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class LifecycleRuleConfig:
    bucket: str
    rule: str
    days: int


@dataclass(frozen=True)
class MinioConfig:
    endpoint: str
    access_key: str
    secret_key: str
    secure: bool
    buckets: List[str]
    lifecycle_rules: List[LifecycleRuleConfig]
