"""Backend tests for Friends Activity endpoint - Iteration 3

Tests the new GET /api/friends/activity endpoint that returns combined feed 
of friends' ratings and comments.
"""

import pytest
import requests


class TestFriendsActivity:
    """Test friends activity feed endpoint"""
    
    def test_friends_activity_endpoint(self, base_url, auth_headers):
        """Test GET /api/friends/activity returns combined feed"""
        response = requests.get(f"{base_url}/api/friends/activity", headers=auth_headers)
        assert response.status_code == 200
        
        activities = response.json()
        assert isinstance(activities, list)
        
        print(f"✓ Friends activity endpoint returned {len(activities)} activities")
        
        # If there are activities, validate structure
        if len(activities) > 0:
            activity = activities[0]
            assert "type" in activity
            assert activity["type"] in ["rating", "comment"]
            assert "user" in activity
            assert "created_at" in activity
            
            if activity["type"] == "rating":
                assert "rating_id" in activity
                assert "title" in activity
                assert "thumbnail" in activity
                assert "rating" in activity
                print(f"✓ Rating activity structure validated")
            
            elif activity["type"] == "comment":
                assert "comment_id" in activity
                assert "rating_id" in activity
                assert "text" in activity
                print(f"✓ Comment activity structure validated")
    
    def test_friends_activity_pagination(self, base_url, auth_headers):
        """Test friends activity with pagination parameters"""
        response = requests.get(
            f"{base_url}/api/friends/activity?skip=0&limit=10", 
            headers=auth_headers
        )
        assert response.status_code == 200
        
        activities = response.json()
        assert isinstance(activities, list)
        assert len(activities) <= 10
        
        print(f"✓ Friends activity pagination working, returned {len(activities)} items")
    
    def test_friends_activity_without_auth(self, base_url):
        """Test friends activity endpoint requires authentication"""
        response = requests.get(f"{base_url}/api/friends/activity")
        assert response.status_code == 401
        print("✓ Friends activity correctly requires authentication")
