"""Backend tests for profile update feature - Iteration 2
Tests PUT /api/users/me for name and bio updates
"""

import pytest
import requests
import uuid


class TestProfileUpdate:
    """Profile update endpoint tests for iteration 2 features"""
    
    def test_update_profile_name_and_bio(self, base_url, auth_headers):
        """Test PUT /api/users/me updates both name and bio"""
        new_name = f"Updated Name {uuid.uuid4().hex[:6]}"
        new_bio = f"My new bio for iteration 2 testing"
        
        payload = {
            "name": new_name,
            "bio": new_bio
        }
        
        # Update profile
        response = requests.put(
            f"{base_url}/api/users/me",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["name"] == new_name
        assert updated_user["bio"] == new_bio
        
        # Verify persistence with GET
        verify_response = requests.get(f"{base_url}/api/auth/me", headers=auth_headers)
        assert verify_response.status_code == 200
        verified = verify_response.json()
        assert verified["name"] == new_name
        assert verified["bio"] == new_bio
        print(f"✓ Profile updated: name='{new_name}', bio='{new_bio}'")
    
    def test_update_profile_name_only(self, base_url, auth_headers):
        """Test updating only name field"""
        new_name = f"NameOnly {uuid.uuid4().hex[:6]}"
        payload = {"name": new_name}
        
        response = requests.put(
            f"{base_url}/api/users/me",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["name"] == new_name
        print(f"✓ Name updated: {new_name}")
    
    def test_update_profile_bio_only(self, base_url, auth_headers):
        """Test updating only bio field"""
        new_bio = f"Bio only update {uuid.uuid4().hex[:6]}"
        payload = {"bio": new_bio}
        
        response = requests.put(
            f"{base_url}/api/users/me",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["bio"] == new_bio
        print(f"✓ Bio updated: {new_bio}")
    
    def test_update_profile_empty_bio(self, base_url, auth_headers):
        """Test setting bio to empty string"""
        payload = {"bio": ""}
        
        response = requests.put(
            f"{base_url}/api/users/me",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        updated_user = response.json()
        assert updated_user["bio"] == ""
        print(f"✓ Bio cleared successfully")
