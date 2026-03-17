import pytest
import os

@pytest.fixture
def base_url():
    """Base URL for API testing - using public URL from env"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
    if not url:
        pytest.fail("EXPO_PUBLIC_BACKEND_URL environment variable not set")
    return url

@pytest.fixture
def test_token():
    """Pre-created test session token for authenticated requests"""
    return "session_423c2867037f4374bb016f26aa3abd7b"

@pytest.fixture
def auth_headers(test_token):
    """Headers with authentication token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {test_token}"
    }
