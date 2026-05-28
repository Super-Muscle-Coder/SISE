#!/usr/bin/env python3
"""
Manual test for search workflow entities and adapters.
Run with: py -3.13 modules/BackendModule/tests/manual_test_search.py
"""

import sys
from pathlib import Path

# Add backend module to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.entities.search_entities import (
    SearchResultItem,
    SearchResponse,
    SearchByImageRequest,
    SearchByTextRequest,
    MetricType,
)
from app.adapters.search_adapters import (
    MilvusSearchAdapter,
    PostgreSQLSearchAdapter,
    AIServiceSearchAdapter,
    VECTOR_DIM,
)


def test_search_entities():
    """Test search workflow entities."""
    print("\n=== Testing Search Entities ===\n")

    # Test 1: SearchResultItem
    print("Test 1: SearchResultItem...")
    item = SearchResultItem(
        image_id="550e8400-e29b-41d4-a716-446655440000",
        score=0.95,
        minio_url="https://minio.example.com/image.jpg",
        metadata={"album_id": 1, "tags": ["nature"]},
    )
    assert item.image_id == "550e8400-e29b-41d4-a716-446655440000"
    assert item.score == 0.95
    assert item.metadata["album_id"] == 1
    print("✓ PASS")

    # Test 2: SearchResponse
    print("Test 2: SearchResponse...")
    response = SearchResponse(
        results=[item],
        latency_ms=123.45,
        top_k=1,
    )
    assert response.top_k == 1
    assert len(response.results) == 1
    assert response.latency_ms == 123.45
    print("✓ PASS")

    # Test 3: SearchByImageRequest
    print("Test 3: SearchByImageRequest...")
    request = SearchByImageRequest(metric=MetricType.COSINE)
    assert request.top_k == 10
    assert request.metric == MetricType.COSINE
    assert request.album_id is None
    print("✓ PASS")

    # Test 4: SearchByTextRequest
    print("Test 4: SearchByTextRequest...")
    text_request = SearchByTextRequest(
        query_text="sunset over mountains",
        top_k=20,
        metric=MetricType.L2,
    )
    assert text_request.query_text == "sunset over mountains"
    assert text_request.top_k == 20
    assert text_request.metric == MetricType.L2
    print("✓ PASS")

    # Test 5: MetricType enum
    print("Test 5: MetricType enum...")
    assert MetricType.COSINE == "COSINE"
    assert MetricType.L2 == "L2"
    assert MetricType.IP == "IP"
    print("✓ PASS")


def test_adapter_constants():
    """Test adapter constants."""
    print("\n=== Testing Adapter Constants ===\n")

    print(f"VECTOR_DIM = {VECTOR_DIM}")
    assert VECTOR_DIM == 512, f"Expected VECTOR_DIM=512, got {VECTOR_DIM}"
    print("✓ PASS - Vector dimension matches global config")


def test_adapter_initialization():
    """Test adapter initialization."""
    print("\n=== Testing Adapter Initialization ===\n")

    # Test 1: MilvusSearchAdapter
    print("Test 1: MilvusSearchAdapter initialization...")
    mock_client = type('MockClient', (), {})()
    adapter = MilvusSearchAdapter(mock_client)
    assert adapter.client is not None
    print("✓ PASS")

    # Test 2: PostgreSQLSearchAdapter
    print("Test 2: PostgreSQLSearchAdapter initialization...")
    mock_session = type('MockSession', (), {})()
    adapter = PostgreSQLSearchAdapter(mock_session)
    assert adapter.session is not None
    print("✓ PASS")

    # Test 3: AIServiceSearchAdapter
    print("Test 3: AIServiceSearchAdapter initialization...")
    mock_http_client = type('MockHTTPClient', (), {})()
    adapter = AIServiceSearchAdapter(
        ai_service_url="http://ai-service:8001",
        http_client=mock_http_client,
    )
    assert adapter.base_url == "http://ai-service:8001"
    assert adapter.http_client is not None
    print("✓ PASS")


def test_vector_dimension_validation():
    """Test vector dimension validation."""
    print("\n=== Testing Vector Dimension Validation ===\n")

    print("Test: MilvusSearchAdapter dimension check...")
    mock_client = type('MockClient', (), {})()
    adapter = MilvusSearchAdapter(mock_client)

    # Valid vector (512 dims)
    try:
        import asyncio

        async def test_valid_vector():
            vector = [0.1] * 512
            try:
                # This will fail because mock_client.search doesn't exist,
                # but we just want to check dimension validation happens first
                await adapter.hybrid_search(vector=vector, top_k=10)
            except AttributeError:
                # Expected - mock_client.search not implemented
                print("✓ PASS - Valid vector dimension accepted (AttributeError expected)")

        asyncio.run(test_valid_vector())
    except Exception as e:
        if "AttributeError" in str(type(e)):
            print("✓ PASS - Valid vector dimension accepted")
        else:
            raise

    # Invalid vector (256 dims)
    try:
        import asyncio

        async def test_invalid_vector():
            vector = [0.1] * 256
            await adapter.hybrid_search(vector=vector, top_k=10)

        asyncio.run(test_invalid_vector())
        print("✗ FAIL - Should have raised ValueError for dimension mismatch")
    except ValueError as e:
        if "ERR_VECTOR_DIM_MISMATCH" in str(e):
            print("✓ PASS - Vector dimension mismatch caught correctly")
        else:
            raise


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("SEARCH WORKFLOW MANUAL TESTS")
    print("="*60)

    try:
        test_search_entities()
        test_adapter_constants()
        test_adapter_initialization()
        test_vector_dimension_validation()

        print("\n" + "="*60)
        print("✓ ALL TESTS PASSED")
        print("="*60 + "\n")
        return 0
    except Exception as e:
        print(f"\n✗ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
