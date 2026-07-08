"""
Routers registry for composition root.
Scaffold phase exports an extendable collection for future workflow routers.
"""

from fastapi import APIRouter

all_routers: list[APIRouter] = []

__all__ = ["all_routers"]