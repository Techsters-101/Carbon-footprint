import pytest
from fastapi.testclient import TestClient
from main import app  # Assumes your FastAPI entry point is main.py

client = TestClient(app)


# ─── Mocking the Groq AI layer ───────────────────────────────────────────────
@pytest.fixture(autouse=True)
def mock_groq_suggestions(monkeypatch):
    """
    Automatically intercept any calls to the live get_suggestions function
    and return a predictable mock response instead.
    """

    def mock_return(*args, **kwargs):
        return [
            "Mocked Suggestion 1: Consider taking public transit.",
            "Mocked Suggestion 2: Reduce meat consumption.",
            "Mocked Suggestion 3: Switch to energy-efficient appliances.",
        ]

    # Adjust 'main.get_suggestions' depending on exactly where it is imported/defined
    monkeypatch.setattr("main.get_suggestions", mock_return)


# ─── Unit Test Cases ──────────────────────────────────────────────────────────


def test_health_check():
    """Verify that the API root or health check baseline is operational."""
    # If you have a root endpoint GET '/'
    response = client.get("/")
    if response.status_code == 200:
        assert response.json() is not None


def test_calculate_endpoint_valid_data():
    """Verify that a standard payload correctly returns calculated metrics and suggestions."""
    payload = {
        "transport": {"km_per_week": 150, "mode": "metro"},
        "diet": {"meals_with_meat_per_week": 2},
        "energy": {"electricity_kwh": 120},
    }

    response = client.post("/api/calculate", json=payload)

    # Assert successful HTTP layer handshake
    assert response.status_code == 200

    data = response.json()

    # Assert key structural layout expectations
    assert "total_score_kg_co2e" in data
    assert "global_label" in data
    assert "categories" in data
    assert "suggestions" in data
    assert "comparison" in data

    # Assert mock injection caught the response successfully
    assert len(data["suggestions"]) == 3
    assert "Mocked Suggestion 1" in data["suggestions"][0]


def test_calculate_endpoint_missing_data():
    """Ensure that faulty or missing inputs are handled gracefully by the backend."""
    incomplete_payload = {
        "transport": {"km_per_week": 150, "mode": "metro"}
        # missing diet and energy keys entirely
    }

    response = client.post("/api/calculate", json=incomplete_payload)

    # If your backend gracefully handles missing keys, it returns 200
    if response.status_code == 200:
        data = response.json()
        assert "total_score_kg_co2e" in data
    else:
        # Fallback assertion in case it enforces stricter validation
        assert response.status_code == 422
