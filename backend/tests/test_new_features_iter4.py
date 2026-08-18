"""Iteration 4 backend tests: auth via code, reports, block/unblock, removed endpoints."""
import os
import uuid
import time
import subprocess
import pytest
import requests


BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')


def db_get_code(email: str) -> str:
    """Read verification code from MongoDB."""
    r = subprocess.run(
        ["mongosh", "--quiet", "test_database", "--eval",
         f'print(db.users.findOne({{email:"{email}"}}).email_verification_code)'],
        capture_output=True, text=True, timeout=10
    )
    return (r.stdout or "").strip().splitlines()[-1].strip()


@pytest.fixture(scope="module")
def testcode_session():
    """Login testcode@example.com/test123 and return session token + user_id."""
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": "testcode@example.com", "password": "test123"},
                      timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    d = r.json()
    return {"token": d["session_token"], "user_id": d["user_id"],
            "headers": {"Authorization": f"Bearer {d['session_token']}",
                        "Content-Type": "application/json"}}


# ---------- Auth: register / verify-code / resend-code / login ----------

class TestAuthNewFlow:

    def test_register_requires_age_confirmed(self):
        email = f"TEST_noage_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          json={"email": email, "password": "pass1234",
                                "name": "NoAge"})  # age_confirmed missing -> False
        assert r.status_code == 400
        assert "13 ans" in r.text or "13" in r.text

    def test_register_returns_requires_verification(self):
        email = f"TEST_new_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          json={"email": email, "password": "pass1234",
                                "name": "NewUser", "age_confirmed": True})
        assert r.status_code == 200
        d = r.json()
        assert d.get("requires_verification") is True
        assert d.get("email") == email
        # No session_token yet
        assert "session_token" not in d

    def test_register_existing_unverified_resends_code(self):
        email = f"TEST_re_{uuid.uuid4().hex[:6]}@example.com"
        r1 = requests.post(f"{BASE_URL}/api/auth/register",
                           json={"email": email, "password": "pass1234",
                                 "name": "Re", "age_confirmed": True})
        assert r1.status_code == 200
        code1 = db_get_code(email)
        # Wait a tiny moment then re-register
        time.sleep(1)
        r2 = requests.post(f"{BASE_URL}/api/auth/register",
                           json={"email": email, "password": "pass1234",
                                 "name": "Re", "age_confirmed": True})
        assert r2.status_code == 200
        assert r2.json().get("requires_verification") is True
        code2 = db_get_code(email)
        assert code1 and code2 and code1 != code2

    def test_verify_code_wrong_then_correct(self):
        email = f"TEST_ver_{uuid.uuid4().hex[:6]}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "pass1234",
                            "name": "Ver", "age_confirmed": True})
        # Wrong code
        r_wrong = requests.post(f"{BASE_URL}/api/auth/verify-code",
                                json={"email": email, "code": "000000"})
        assert r_wrong.status_code == 400
        # Correct code
        code = db_get_code(email)
        assert code and len(code) == 6
        r_ok = requests.post(f"{BASE_URL}/api/auth/verify-code",
                             json={"email": email, "code": code})
        assert r_ok.status_code == 200
        d = r_ok.json()
        assert "session_token" in d
        # session_token must work with /me
        me = requests.get(f"{BASE_URL}/api/auth/me",
                          headers={"Authorization": f"Bearer {d['session_token']}"})
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_verify_code_rate_limit_429(self):
        email = f"TEST_rl_{uuid.uuid4().hex[:6]}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "pass1234",
                            "name": "Rl", "age_confirmed": True})
        # 5 wrong attempts -> next returns 429
        last = None
        for _ in range(6):
            last = requests.post(f"{BASE_URL}/api/auth/verify-code",
                                 json={"email": email, "code": "111111"})
        assert last.status_code == 429

    def test_resend_code_cooldown(self):
        email = f"TEST_rc_{uuid.uuid4().hex[:6]}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "pass1234",
                            "name": "Rc", "age_confirmed": True})
        # Immediate resend should hit cooldown
        r = requests.post(f"{BASE_URL}/api/auth/resend-code", json={"email": email})
        assert r.status_code == 429

    def test_resend_code_verified_email_400(self):
        r = requests.post(f"{BASE_URL}/api/auth/resend-code",
                          json={"email": "testcode@example.com"})
        assert r.status_code == 400

    def test_login_unverified_returns_403(self):
        email = f"TEST_unv_{uuid.uuid4().hex[:6]}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "pass1234",
                            "name": "Unv", "age_confirmed": True})
        r = requests.post(f"{BASE_URL}/api/auth/login",
                         json={"email": email, "password": "pass1234"})
        assert r.status_code == 403
        assert "EMAIL_NOT_VERIFIED" in r.text

    def test_login_testcode_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                         json={"email": "testcode@example.com", "password": "test123"})
        assert r.status_code == 200
        assert "session_token" in r.json()


# ---------- Removed endpoints ----------

class TestRemovedEndpoints:

    def test_google_session_removed(self):
        r = requests.post(f"{BASE_URL}/api/auth/google-session",
                          json={"session_id": "x"})
        assert r.status_code == 404

    def test_youtube_search_removed(self):
        r = requests.get(f"{BASE_URL}/api/youtube/search?q=test")
        assert r.status_code == 404

    def test_youtube_trending_removed(self):
        r = requests.get(f"{BASE_URL}/api/youtube/trending")
        assert r.status_code == 404


# ---------- Reports ----------

class TestReports:

    def test_report_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/reports",
                          json={"content_type": "user", "content_id": "user_x",
                                "reason": "spam"})
        assert r.status_code == 401

    def test_report_invalid_type(self, testcode_session):
        r = requests.post(f"{BASE_URL}/api/reports",
                          json={"content_type": "bogus",
                                "content_id": "x", "reason": "spam"},
                          headers=testcode_session["headers"])
        assert r.status_code == 400

    def test_report_success(self, testcode_session):
        r = requests.post(f"{BASE_URL}/api/reports",
                          json={"content_type": "user",
                                "content_id": "user_dummy_target",
                                "reason": "spam",
                                "details": "TEST report"},
                          headers=testcode_session["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d.get("success") is True
        assert "report_id" in d


# ---------- Block / Unblock / List ----------

class TestBlocking:

    def _create_user(self):
        email = f"TEST_blk_{uuid.uuid4().hex[:6]}@example.com"
        # Register then verify to get session (need real user to block)
        requests.post(f"{BASE_URL}/api/auth/register",
                      json={"email": email, "password": "pass1234",
                            "name": "Blockee", "age_confirmed": True})
        code = db_get_code(email)
        v = requests.post(f"{BASE_URL}/api/auth/verify-code",
                          json={"email": email, "code": code})
        d = v.json()
        return d["user_id"], d["session_token"]

    def test_block_unblock_list_flow(self, testcode_session):
        target_id, target_token = self._create_user()
        h = testcode_session["headers"]

        # Block
        r = requests.post(f"{BASE_URL}/api/users/{target_id}/block", headers=h)
        assert r.status_code == 200
        assert r.json().get("success") is True

        # List blocked contains target
        r_list = requests.get(f"{BASE_URL}/api/users/me/blocked", headers=h)
        assert r_list.status_code == 200
        blocked = r_list.json()
        assert any(u["user_id"] == target_id for u in blocked)

        # Rate a video as blocked user
        rate = requests.post(f"{BASE_URL}/api/videos/rate",
                             json={"youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
                                   "rating": 5, "comment": "TEST from blocked user"},
                             headers={"Authorization": f"Bearer {target_token}",
                                      "Content-Type": "application/json"})
        assert rate.status_code == 200

        # Discover feed should not include the blocked user's rating
        disc = requests.get(f"{BASE_URL}/api/videos/discover", headers=h)
        assert disc.status_code == 200
        assert not any(v.get("user_id") == target_id for v in disc.json())

        # Unblock
        r_ub = requests.delete(f"{BASE_URL}/api/users/{target_id}/block", headers=h)
        assert r_ub.status_code == 200

        # Blocked list no longer contains user
        r_list2 = requests.get(f"{BASE_URL}/api/users/me/blocked", headers=h)
        assert not any(u["user_id"] == target_id for u in r_list2.json())

    def test_cannot_block_self(self, testcode_session):
        me = requests.get(f"{BASE_URL}/api/auth/me",
                          headers=testcode_session["headers"]).json()
        r = requests.post(f"{BASE_URL}/api/users/{me['user_id']}/block",
                          headers=testcode_session["headers"])
        assert r.status_code == 400
