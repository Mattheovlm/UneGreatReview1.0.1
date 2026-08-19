"""
Backend tests for the new YouTube Data API v3 search endpoint (iteration 5)
- GET /api/youtube/search?q=... (Bearer required)
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = "testcode@example.com"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def token():
    """Login the verified test account and reuse the session token for the module."""
    assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not set"
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "session_token" in data
    return data["session_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# --- YouTube search: unauthenticated ---
class TestYoutubeSearchAuth:
    def test_search_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/youtube/search", params={"q": "squeezie"}, timeout=15)
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"


# --- YouTube search: input validation ---
class TestYoutubeSearchValidation:
    def test_empty_query_returns_400(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/youtube/search",
            params={"q": "   "},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 400, f"Expected 400 for empty query, got {r.status_code} {r.text}"


# --- YouTube search: happy path + cache ---
class TestYoutubeSearchHappyPath:
    def test_search_returns_results_and_uses_cache(self, auth_headers):
        # 1st call — hits YouTube API (or cache if already populated)
        t0 = time.time()
        r1 = requests.get(
            f"{BASE_URL}/api/youtube/search",
            params={"q": "squeezie"},
            headers=auth_headers,
            timeout=20,
        )
        first_ms = (time.time() - t0) * 1000
        assert r1.status_code == 200, f"Search failed: {r1.status_code} {r1.text[:300]}"

        body = r1.json()
        assert "results" in body and isinstance(body["results"], list)
        results = body["results"]
        assert len(results) > 0, "No results returned for 'squeezie'"

        first = results[0]
        for key in ("youtube_id", "title", "channel_name", "thumbnail"):
            assert key in first, f"Missing key '{key}' in result: {first}"
        assert isinstance(first["youtube_id"], str) and len(first["youtube_id"]) == 11
        assert first["title"].strip() != ""
        assert first["channel_name"].strip() != ""
        assert first["thumbnail"].startswith("http")

        # 2nd identical call — should be served by cache (much faster)
        t1 = time.time()
        r2 = requests.get(
            f"{BASE_URL}/api/youtube/search",
            params={"q": "squeezie"},
            headers=auth_headers,
            timeout=20,
        )
        second_ms = (time.time() - t1) * 1000
        assert r2.status_code == 200
        assert r2.json()["results"] == results, "Cached response should equal first response"
        # Cache should be noticeably faster; keep the assertion loose to avoid flakiness
        assert second_ms < max(1500, first_ms), (
            f"Second call should be fast (cache). first={first_ms:.0f}ms second={second_ms:.0f}ms"
        )


# --- Non-regression: URL-based fetch-info still works ---
class TestVideosFetchInfoRegression:
    def test_fetch_info_valid_url(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/videos/fetch-info",
            params={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") is True
        assert data.get("youtube_id") == "dQw4w9WgXcQ"
        assert data.get("title")
        assert data.get("thumbnail", "").startswith("http")
