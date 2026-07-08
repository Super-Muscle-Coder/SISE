"""
Friends adapters.

This workflow currently does not require a dedicated adapter layer because it
only uses AsyncSession injected by dependencies.py and has no external client
to adapt beyond SQLAlchemy itself.
"""

__all__: list[str] = []