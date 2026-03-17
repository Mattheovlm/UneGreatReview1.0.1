"""Backend API tests for Social Cinema - Letterboxd for YouTube

Tests cover:
- Authentication endpoints (register, login, me, logout)
- User endpoints (search, get user, update profile)
- Friend endpoints (request, accept, decline, list, status)
- Video rating endpoints (rate, feed, discover, search, detail)
- Comment endpoints
"""

import pytest
import requests
import uuid
import time


class TestHealth:
    """Health check endpoint"""
    
    def test_health_endpoint(self, base_url):
        """Verify API is running and healthy"""
        response = requests.get(f"{base_url}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health check passed")


class TestAuth:
    """Authentication flow tests"""
    
    def test_auth_me_with_valid_token(self, base_url, auth_headers):
        """Test GET /api/auth/me with valid Bearer token"""
        response = requests.get(f"{base_url}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        
        user = response.json()
        assert "user_id" in user
        assert "email" in user
        assert "name" in user
        assert user["email"] == "test@test.com"
        print(f"✓ Auth check passed for user: {user['email']}")
    
    def test_auth_me_without_token(self, base_url):
        """Test auth/me without token returns 401"""
        response = requests.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth check correctly rejects unauthenticated request")
    
    def test_register_new_user(self, base_url):
        """Test POST /api/auth/register creates new user"""
        unique_email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "email": unique_email,
            "password": "password123",
            "name": "Test User Register"
        }
        
        response = requests.post(
            f"{base_url}/api/auth/register",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "session_token" in data
        assert data["email"] == unique_email
        assert data["name"] == payload["name"]
        
        # Verify persistence with auth/me
        verify_response = requests.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {data['session_token']}"}
        )
        assert verify_response.status_code == 200
        verified_user = verify_response.json()
        assert verified_user["email"] == unique_email
        print(f"✓ User registration successful: {unique_email}")
    
    def test_register_duplicate_email(self, base_url):
        """Test registering with existing email returns 400"""
        payload = {
            "email": "test@test.com",
            "password": "password123",
            "name": "Duplicate"
        }
        response = requests.post(f"{base_url}/api/auth/register", json=payload)
        assert response.status_code == 400
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_with_valid_credentials(self, base_url):
        """Test POST /api/auth/login with valid credentials"""
        # First create a user to login with
        unique_email = f"test_login_{uuid.uuid4().hex[:8]}@example.com"
        register_payload = {
            "email": unique_email,
            "password": "logintest123",
            "name": "Login Test User"
        }
        requests.post(f"{base_url}/api/auth/register", json=register_payload)
        
        # Now try to login
        login_payload = {
            "email": unique_email,
            "password": "logintest123"
        }
        response = requests.post(f"{base_url}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "session_token" in data
        assert "user_id" in data
        assert data["email"] == unique_email
        print(f"✓ Login successful for: {unique_email}")
    
    def test_login_with_invalid_credentials(self, base_url):
        """Test login with wrong password returns 401"""
        payload = {
            "email": "test@test.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{base_url}/api/auth/login", json=payload)
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")


class TestUsers:
    """User management endpoints"""
    
    def test_search_users(self, base_url, auth_headers):
        """Test GET /api/users/search?q=query"""
        response = requests.get(
            f"{base_url}/api/users/search?q=Test",
            headers=auth_headers
        )
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"✓ User search returned {len(users)} results")
    
    def test_get_user_profile(self, base_url, auth_headers):
        """Test GET /api/users/{user_id}"""
        # First get current user to get user_id
        me_response = requests.get(f"{base_url}/api/auth/me", headers=auth_headers)
        user_id = me_response.json()["user_id"]
        
        response = requests.get(
            f"{base_url}/api/users/{user_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        user = response.json()
        assert user["user_id"] == user_id
        assert "email" in user
        assert "video_count" in user
        assert "friends_count" in user
        print(f"✓ User profile retrieved: {user['name']}")
    
    def test_update_user_profile(self, base_url, auth_headers):
        """Test PUT /api/users/me updates profile"""
        new_bio = f"Updated bio {uuid.uuid4().hex[:8]}"
        payload = {
            "bio": new_bio,
            "theme_preference": "light"
        }
        
        response = requests.put(
            f"{base_url}/api/users/me",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["bio"] == new_bio
        assert updated_user["theme_preference"] == "light"
        
        # Verify persistence
        verify_response = requests.get(f"{base_url}/api/auth/me", headers=auth_headers)
        verified = verify_response.json()
        assert verified["bio"] == new_bio
        print(f"✓ Profile updated successfully")


class TestFriends:
    """Friend management endpoints"""
    
    def test_friend_request_flow(self, base_url, auth_headers):
        """Test complete friend request flow: send, accept, list"""
        # Create a second user to send friend request to
        second_user_email = f"friend_{uuid.uuid4().hex[:8]}@example.com"
        second_user_payload = {
            "email": second_user_email,
            "password": "password123",
            "name": "Friend User"
        }
        reg_response = requests.post(
            f"{base_url}/api/auth/register",
            json=second_user_payload
        )
        second_user = reg_response.json()
        second_user_token = second_user["session_token"]
        second_user_id = second_user["user_id"]
        
        # Send friend request from test user to second user
        request_payload = {"to_user_id": second_user_id}
        send_response = requests.post(
            f"{base_url}/api/friends/request",
            json=request_payload,
            headers=auth_headers
        )
        assert send_response.status_code == 200
        request_data = send_response.json()
        assert "request_id" in request_data
        request_id = request_data["request_id"]
        print(f"✓ Friend request sent: {request_id}")
        
        # Check pending requests for second user
        requests_response = requests.get(
            f"{base_url}/api/friends/requests",
            headers={"Authorization": f"Bearer {second_user_token}"}
        )
        assert requests_response.status_code == 200
        pending_requests = requests_response.json()
        assert len(pending_requests) > 0
        assert any(r["request_id"] == request_id for r in pending_requests)
        print(f"✓ Friend request visible in recipient's pending list")
        
        # Accept friend request
        accept_response = requests.post(
            f"{base_url}/api/friends/accept/{request_id}",
            headers={"Authorization": f"Bearer {second_user_token}"}
        )
        assert accept_response.status_code == 200
        print(f"✓ Friend request accepted")
        
        # Verify friendship exists in friends list
        friends_response = requests.get(
            f"{base_url}/api/friends",
            headers=auth_headers
        )
        assert friends_response.status_code == 200
        friends = friends_response.json()
        assert any(f["user_id"] == second_user_id for f in friends)
        print(f"✓ Friendship confirmed in friends list")
    
    def test_get_friends_list(self, base_url, auth_headers):
        """Test GET /api/friends returns list"""
        response = requests.get(f"{base_url}/api/friends", headers=auth_headers)
        assert response.status_code == 200
        friends = response.json()
        assert isinstance(friends, list)
        print(f"✓ Friends list retrieved: {len(friends)} friends")
    
    def test_get_friend_status(self, base_url, auth_headers):
        """Test GET /api/friends/status/{user_id}"""
        # Create a user to check status with
        test_user_email = f"status_{uuid.uuid4().hex[:8]}@example.com"
        reg_response = requests.post(
            f"{base_url}/api/auth/register",
            json={"email": test_user_email, "password": "pass123", "name": "Status Test"}
        )
        test_user_id = reg_response.json()["user_id"]
        
        response = requests.get(
            f"{base_url}/api/friends/status/{test_user_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        status = response.json()
        assert "status" in status
        assert status["status"] in ["friends", "pending_sent", "pending_received", "none"]
        print(f"✓ Friend status check: {status['status']}")


class TestVideos:
    """Video rating endpoints"""
    
    def test_rate_video(self, base_url, auth_headers):
        """Test POST /api/videos/rate creates/updates rating"""
        payload = {
            "youtube_url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
            "rating": 4,
            "comment": "Great video!"
        }
        
        response = requests.post(
            f"{base_url}/api/videos/rate",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "rating_id" in data
        assert data["rating"] == 4
        assert data["youtube_id"] == "jNQXAC9IVRw"
        
        # Verify persistence by getting video detail
        detail_response = requests.get(
            f"{base_url}/api/videos/{data['rating_id']}",
            headers=auth_headers
        )
        assert detail_response.status_code == 200
        detail = detail_response.json()
        assert detail["rating"] == 4
        assert detail["comment"] == "Great video!"
        print(f"✓ Video rated successfully: {data['rating_id']}")
    
    def test_rate_video_invalid_rating(self, base_url, auth_headers):
        """Test rating validation (must be 1-5)"""
        payload = {
            "youtube_url": "https://www.youtube.com/watch?v=test123",
            "rating": 6,
            "comment": "Invalid rating"
        }
        response = requests.post(
            f"{base_url}/api/videos/rate",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 400
        print("✓ Invalid rating correctly rejected")
    
    def test_get_feed(self, base_url, auth_headers):
        """Test GET /api/videos/feed returns friend videos"""
        response = requests.get(f"{base_url}/api/videos/feed", headers=auth_headers)
        assert response.status_code == 200
        
        feed = response.json()
        assert isinstance(feed, list)
        # Feed should include user field for each video
        if len(feed) > 0:
            assert "user" in feed[0]
            assert "comment_count" in feed[0]
        print(f"✓ Feed retrieved: {len(feed)} videos")
    
    def test_get_discover(self, base_url, auth_headers):
        """Test GET /api/videos/discover returns all videos"""
        response = requests.get(f"{base_url}/api/videos/discover", headers=auth_headers)
        assert response.status_code == 200
        
        videos = response.json()
        assert isinstance(videos, list)
        if len(videos) > 0:
            assert "rating_id" in videos[0]
            assert "youtube_id" in videos[0]
            assert "user" in videos[0]
        print(f"✓ Discover feed retrieved: {len(videos)} videos")
    
    def test_search_videos(self, base_url, auth_headers):
        """Test GET /api/videos/search?q=query"""
        response = requests.get(
            f"{base_url}/api/videos/search?q=video",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        results = response.json()
        assert isinstance(results, list)
        print(f"✓ Video search returned {len(results)} results")
    
    def test_get_video_detail(self, base_url, auth_headers):
        """Test GET /api/videos/{rating_id} with pre-existing video"""
        rating_id = "rating_dd9925197dff"
        response = requests.get(
            f"{base_url}/api/videos/{rating_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        video = response.json()
        assert video["rating_id"] == rating_id
        assert "user" in video
        assert "comments" in video
        assert isinstance(video["comments"], list)
        print(f"✓ Video detail retrieved: {video['title']}")
    
    def test_add_comment_to_video(self, base_url, auth_headers):
        """Test POST /api/videos/{rating_id}/comments"""
        rating_id = "rating_dd9925197dff"
        payload = {"text": f"Test comment {uuid.uuid4().hex[:8]}"}
        
        response = requests.post(
            f"{base_url}/api/videos/{rating_id}/comments",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        comment = response.json()
        assert "comment_id" in comment
        assert comment["text"] == payload["text"]
        assert "user" in comment
        
        # Verify comment appears in video detail
        detail_response = requests.get(
            f"{base_url}/api/videos/{rating_id}",
            headers=auth_headers
        )
        detail = detail_response.json()
        assert any(c["comment_id"] == comment["comment_id"] for c in detail["comments"])
        print(f"✓ Comment added successfully: {comment['comment_id']}")


class TestRecommendations:
    """AI recommendations endpoint"""
    
    def test_get_recommendations(self, base_url, auth_headers):
        """Test GET /api/recommendations returns AI suggestions"""
        response = requests.get(
            f"{base_url}/api/recommendations",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should have either ai_recommendations or popular_videos
        assert "ai_recommendations" in data
        assert isinstance(data["ai_recommendations"], list)
        print(f"✓ Recommendations retrieved")
        # Note: AI may take time, so we just verify endpoint works
