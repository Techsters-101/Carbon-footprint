from fastapi.testclient import TestClient
from main import app


def test_root_endpoint():
    """Ensure the API is awake and responding."""
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200


def test_calculate_endpoint_valid_data():
    """Verify that a standard payload correctly returns calculated metrics."""
    payload = {
        "transport_car_km_per_week": 150,
        "transport_train_km_per_month": 50,
        "transport_flights_per_year": 1,
        "diet_meat_meals_per_week": 2,
        "diet_delivery_orders_per_month": 3,
        "energy_bill_inr_per_month": 1500,
        "energy_devices_hours_per_day": 8,
    }

    # Using the 'with' block ensures the SQLite database initializes during the test
    with TestClient(app) as client:
        response = client.post("/api/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "total_score_kg_co2e" in data
        assert "suggestions" in data


def test_calculate_endpoint_invalid_data():
    """Ensure faulty inputs are caught by Pydantic validation."""
    # Sending a string where a float is expected
    bad_payload = {"transport_car_km_per_week": "invalid_string_data"}

    with TestClient(app) as client:
        response = client.post("/api/calculate", json=bad_payload)
        # 422 is the standard HTTP code for Unprocessable Entity (Validation Error)
        assert response.status_code == 422
