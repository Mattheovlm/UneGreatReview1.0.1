from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import re
import json
import httpx
import bcrypt
from datetime import datetime, timezone, timedelta
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'social-cinema-secret')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleSessionRequest(BaseModel):
    session_id: str

class VideoRateRequest(BaseModel):
    youtube_url: str
    rating: float  # Support 0.5 increments: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
    comment: Optional[str] = ""

class CommentCreate(BaseModel):
    text: str

class FriendRequestCreate(BaseModel):
    to_user_id: str

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class PlaylistAddVideo(BaseModel):
    youtube_id: str
    title: str
    thumbnail: str
    channel_name: Optional[str] = ""

class LikeRating(BaseModel):
    rating_id: str

class NotificationType:
    FRIEND_RATED = "friend_rated"
    COMMENT_RECEIVED = "comment_received"
    LIKE_RECEIVED = "like_received"
    FRIEND_REQUEST = "friend_request"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    theme_preference: Optional[str] = None

# --- Helpers ---
def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'(?:embed/)([a-zA-Z0-9_-]{11})',
        r'(?:shorts/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def get_youtube_info(youtube_url: str) -> dict:
    youtube_id = extract_youtube_id(youtube_url)
    if not youtube_id:
        raise HTTPException(400, "Invalid YouTube URL")
    try:
        async with httpx.AsyncClient() as http:
            resp = await http.get(
                f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={youtube_id}&format=json",
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "youtube_id": youtube_id,
                    "title": data.get("title", "YouTube Video"),
                    "channel_name": data.get("author_name", "Unknown"),
                    "thumbnail": f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg"
                }
    except Exception as e:
        logger.warning(f"oEmbed failed: {e}")
    return {
        "youtube_id": youtube_id,
        "title": "YouTube Video",
        "channel_name": "Unknown",
        "thumbnail": f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg"
    }

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(401, "Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

async def enrich_ratings(ratings: list) -> list:
    for rating in ratings:
        u = await db.users.find_one({"user_id": rating["user_id"]}, {"_id": 0, "password_hash": 0})
        if u:
            rating["user"] = u
        rating["comment_count"] = await db.comments.count_documents({"rating_id": rating["rating_id"]})
    return ratings

# --- Auth ---
@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    
    password_hash = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    await db.users.insert_one({
        "user_id": user_id, "email": data.email, "name": data.name,
        "picture": "", "password_hash": password_hash, "bio": "",
        "theme_preference": "dark", "created_at": datetime.now(timezone.utc)
    })
    
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token, "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(key="session_token", value=session_token, path="/",
                        secure=True, httponly=True, samesite="none", max_age=7*24*60*60)
    return {"user_id": user_id, "email": data.email, "name": data.name,
            "picture": "", "session_token": session_token}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Invalid credentials")
    if not bcrypt.checkpw(data.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Invalid credentials")
    
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token, "user_id": user["user_id"],
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(key="session_token", value=session_token, path="/",
                        secure=True, httponly=True, samesite="none", max_age=7*24*60*60)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"],
            "picture": user.get("picture", ""), "session_token": session_token}

@api_router.post("/auth/google-session")
async def google_session(data: GoogleSessionRequest, response: Response):
    async with httpx.AsyncClient() as http:
        resp = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}, timeout=10
        )
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid Google session")
    
    google_data = resp.json()
    existing = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {
            "name": google_data.get("name", existing["name"]),
            "picture": google_data.get("picture", existing.get("picture", ""))
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": google_data["email"],
            "name": google_data.get("name", ""), "picture": google_data.get("picture", ""),
            "password_hash": "", "bio": "", "theme_preference": "dark",
            "created_at": datetime.now(timezone.utc)
        })
    
    session_token = google_data.get("session_token", f"session_{uuid.uuid4().hex}")
    await db.user_sessions.insert_one({
        "session_token": session_token, "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(key="session_token", value=session_token, path="/",
                        secure=True, httponly=True, samesite="none", max_age=7*24*60*60)
    return {"user_id": user_id, "email": google_data["email"],
            "name": google_data.get("name", ""), "picture": google_data.get("picture", ""),
            "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# --- Users ---
@api_router.get("/users/search")
async def search_users(q: str, request: Request):
    user = await get_current_user(request)
    users = await db.users.find(
        {"name": {"$regex": q, "$options": "i"}, "user_id": {"$ne": user["user_id"]}},
        {"_id": 0, "password_hash": 0}
    ).limit(20).to_list(20)
    return users

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, request: Request):
    await get_current_user(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "User not found")
    
    # Add stats
    user["video_count"] = await db.video_ratings.count_documents({"user_id": user_id})
    friends_count = await db.friendships.count_documents(
        {"$or": [{"user_id": user_id}, {"friend_id": user_id}]}
    )
    user["friends_count"] = friends_count
    return user

@api_router.put("/users/me")
async def update_profile(data: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    update = {}
    if data.name is not None: update["name"] = data.name
    if data.bio is not None: update["bio"] = data.bio
    if data.theme_preference is not None: update["theme_preference"] = data.theme_preference
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    return await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})

# --- Taste Analysis ---
@api_router.get("/users/{user_id}/taste-analysis")
async def get_taste_analysis(user_id: str, request: Request):
    await get_current_user(request)
    
    # Get all user ratings
    ratings = await db.video_ratings.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(500)
    
    if not ratings:
        return {
            "total_ratings": 0,
            "average_rating": 0,
            "critic_type": "Nouveau",
            "critic_emoji": "🌱",
            "favorite_genres": [],
            "rating_distribution": {}
        }
    
    # Calculate average
    total = sum(r["rating"] for r in ratings)
    average = round(total / len(ratings), 1)
    
    # Determine critic type based on average
    if average <= 2.5:
        critic_type = "Sévère"
        critic_emoji = "🧊"
    elif average <= 3.5:
        critic_type = "Équilibré"
        critic_emoji = "⚖️"
    else:
        critic_type = "Enthousiaste"
        critic_emoji = "🔥"
    
    # Analyze genres from video titles (simple keyword matching)
    genre_keywords = {
        "Gaming": ["gaming", "game", "jeux", "minecraft", "fortnite", "playstation", "xbox", "nintendo", "gameplay", "let's play"],
        "Musique": ["music", "musique", "song", "clip", "album", "concert", "live", "cover", "remix"],
        "Science": ["science", "physics", "math", "experiment", "research", "study", "documentary"],
        "Tech": ["tech", "technology", "iphone", "android", "computer", "programming", "code", "software"],
        "Comédie": ["comedy", "funny", "humour", "humor", "prank", "fail", "meme", "rire", "blague"],
        "Sport": ["sport", "football", "soccer", "basketball", "tennis", "gym", "fitness", "workout"],
        "Vlog": ["vlog", "daily", "life", "routine", "day in"],
        "Cinéma": ["movie", "film", "trailer", "cinema", "review", "critique", "actor"],
        "Éducation": ["tutorial", "learn", "how to", "course", "lesson", "education", "guide"]
    }
    
    genre_counts = {genre: 0 for genre in genre_keywords}
    for r in ratings:
        title_lower = r.get("title", "").lower()
        for genre, keywords in genre_keywords.items():
            if any(kw in title_lower for kw in keywords):
                genre_counts[genre] += 1
    
    # Get top genres
    sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
    favorite_genres = [{"name": g[0], "count": g[1]} for g in sorted_genres if g[1] > 0][:3]
    
    # Rating distribution
    distribution = {str(i): 0 for i in [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]}
    for r in ratings:
        key = str(r["rating"])
        if key in distribution:
            distribution[key] += 1
    
    return {
        "total_ratings": len(ratings),
        "average_rating": average,
        "critic_type": critic_type,
        "critic_emoji": critic_emoji,
        "favorite_genres": favorite_genres,
        "rating_distribution": distribution
    }

# --- Duel de Critiques ---
@api_router.get("/videos/{rating_id}/duel")
async def get_video_duel(rating_id: str, request: Request):
    await get_current_user(request)
    
    # Get the video info from the rating
    rating = await db.video_ratings.find_one({"rating_id": rating_id}, {"_id": 0})
    if not rating:
        raise HTTPException(404, "Rating not found")
    
    # Get all ratings for this video (by youtube_id)
    all_ratings = await db.video_ratings.find(
        {"youtube_id": rating["youtube_id"]}, {"_id": 0}
    ).to_list(100)
    
    if len(all_ratings) < 2:
        return {"show_duel": False, "message": "Pas assez de notes pour un duel"}
    
    # Find highest and lowest
    sorted_ratings = sorted(all_ratings, key=lambda x: x["rating"])
    lowest = sorted_ratings[0]
    highest = sorted_ratings[-1]
    
    # Calculate gap
    gap = highest["rating"] - lowest["rating"]
    show_duel = gap >= 2  # Show duel if gap is 2 or more
    
    # Enrich with user info
    async def enrich_rating(r):
        user = await db.users.find_one({"user_id": r["user_id"]}, {"_id": 0, "password_hash": 0})
        return {**r, "user": user}
    
    return {
        "show_duel": show_duel,
        "gap": gap,
        "total_ratings": len(all_ratings),
        "highest": await enrich_rating(highest),
        "lowest": await enrich_rating(lowest)
    }

@api_router.get("/videos/controversial")
async def get_controversial_videos(request: Request):
    """Get videos with the biggest rating gaps (debates)"""
    await get_current_user(request)
    
    # Aggregate to find videos with max gap
    pipeline = [
        {"$group": {
            "_id": "$youtube_id",
            "title": {"$first": "$title"},
            "thumbnail": {"$first": "$thumbnail"},
            "channel_name": {"$first": "$channel_name"},
            "max_rating": {"$max": "$rating"},
            "min_rating": {"$min": "$rating"},
            "avg_rating": {"$avg": "$rating"},
            "count": {"$sum": 1},
            "sample_rating_id": {"$first": "$rating_id"}
        }},
        {"$match": {"count": {"$gte": 2}}},  # At least 2 ratings
        {"$addFields": {"gap": {"$subtract": ["$max_rating", "$min_rating"]}}},
        {"$match": {"gap": {"$gte": 2}}},  # Gap of at least 2 stars
        {"$sort": {"gap": -1}},
        {"$limit": 5}
    ]
    
    results = await db.video_ratings.aggregate(pipeline).to_list(5)
    
    return [{
        "youtube_id": r["_id"],
        "title": r["title"],
        "thumbnail": r["thumbnail"],
        "channel_name": r["channel_name"],
        "rating_id": r["sample_rating_id"],
        "gap": r["gap"],
        "max_rating": r["max_rating"],
        "min_rating": r["min_rating"],
        "avg_rating": round(r["avg_rating"], 1),
        "rating_count": r["count"]
    } for r in results]

# --- Video Info Fetch ---
@api_router.get("/videos/fetch-info")
async def fetch_video_info(url: str, request: Request):
    """Fetch video info from URL before rating"""
    await get_current_user(request)
    
    try:
        info = await get_youtube_info(url)
        return {
            "success": True,
            "youtube_id": info["youtube_id"],
            "title": info["title"],
            "thumbnail": info["thumbnail"],
            "channel_name": info["channel_name"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# --- Friends ---
@api_router.post("/friends/request")
async def send_friend_request(data: FriendRequestCreate, request: Request):
    user = await get_current_user(request)
    if user["user_id"] == data.to_user_id:
        raise HTTPException(400, "Cannot friend yourself")
    
    existing_friendship = await db.friendships.find_one({
        "$or": [
            {"user_id": user["user_id"], "friend_id": data.to_user_id},
            {"user_id": data.to_user_id, "friend_id": user["user_id"]}
        ]
    })
    if existing_friendship:
        raise HTTPException(400, "Already friends")
    
    existing = await db.friend_requests.find_one({
        "from_user_id": user["user_id"], "to_user_id": data.to_user_id, "status": "pending"
    })
    if existing:
        raise HTTPException(400, "Request already sent")
    
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    await db.friend_requests.insert_one({
        "request_id": request_id, "from_user_id": user["user_id"],
        "to_user_id": data.to_user_id, "status": "pending",
        "created_at": datetime.now(timezone.utc)
    })
    return {"request_id": request_id, "status": "pending"}

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, request: Request):
    user = await get_current_user(request)
    freq = await db.friend_requests.find_one(
        {"request_id": request_id, "to_user_id": user["user_id"], "status": "pending"}, {"_id": 0}
    )
    if not freq:
        raise HTTPException(404, "Request not found")
    
    await db.friend_requests.update_one({"request_id": request_id}, {"$set": {"status": "accepted"}})
    await db.friendships.insert_one({
        "friendship_id": f"friend_{uuid.uuid4().hex[:12]}",
        "user_id": freq["from_user_id"], "friend_id": user["user_id"],
        "created_at": datetime.now(timezone.utc)
    })
    return {"status": "accepted"}

@api_router.post("/friends/decline/{request_id}")
async def decline_friend_request(request_id: str, request: Request):
    user = await get_current_user(request)
    freq = await db.friend_requests.find_one(
        {"request_id": request_id, "to_user_id": user["user_id"], "status": "pending"}, {"_id": 0}
    )
    if not freq:
        raise HTTPException(404, "Request not found")
    await db.friend_requests.update_one({"request_id": request_id}, {"$set": {"status": "declined"}})
    return {"status": "declined"}

@api_router.get("/friends")
async def get_friends(request: Request):
    user = await get_current_user(request)
    friendships = await db.friendships.find(
        {"$or": [{"user_id": user["user_id"]}, {"friend_id": user["user_id"]}]}, {"_id": 0}
    ).to_list(100)
    
    friend_ids = []
    for f in friendships:
        friend_ids.append(f["friend_id"] if f["user_id"] == user["user_id"] else f["user_id"])
    
    friends = await db.users.find(
        {"user_id": {"$in": friend_ids}}, {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return friends

@api_router.get("/friends/requests")
async def get_friend_requests(request: Request):
    user = await get_current_user(request)
    reqs = await db.friend_requests.find(
        {"to_user_id": user["user_id"], "status": "pending"}, {"_id": 0}
    ).to_list(50)
    for r in reqs:
        from_user = await db.users.find_one({"user_id": r["from_user_id"]}, {"_id": 0, "password_hash": 0})
        if from_user:
            r["from_user"] = from_user
    return reqs

@api_router.get("/friends/status/{user_id}")
async def get_friend_status(user_id: str, request: Request):
    user = await get_current_user(request)
    friendship = await db.friendships.find_one({
        "$or": [
            {"user_id": user["user_id"], "friend_id": user_id},
            {"user_id": user_id, "friend_id": user["user_id"]}
        ]
    })
    if friendship:
        return {"status": "friends"}
    
    sent = await db.friend_requests.find_one({
        "from_user_id": user["user_id"], "to_user_id": user_id, "status": "pending"
    })
    if sent:
        return {"status": "pending_sent"}
    
    received = await db.friend_requests.find_one({
        "from_user_id": user_id, "to_user_id": user["user_id"], "status": "pending"
    })
    if received:
        return {"status": "pending_received", "request_id": received["request_id"]}
    
    return {"status": "none"}

# --- Friends Activity ---
@api_router.get("/friends/activity")
async def get_friends_activity(request: Request, skip: int = 0, limit: int = 30):
    """Get combined activity feed: friends' ratings + comments"""
    user = await get_current_user(request)
    
    # Get friend ids
    friendships = await db.friendships.find(
        {"$or": [{"user_id": user["user_id"]}, {"friend_id": user["user_id"]}]}, {"_id": 0}
    ).to_list(100)
    friend_ids = []
    for f in friendships:
        friend_ids.append(f["friend_id"] if f["user_id"] == user["user_id"] else f["user_id"])
    
    if not friend_ids:
        return []
    
    activities = []
    
    # Get friends' recent ratings
    ratings = await db.video_ratings.find(
        {"user_id": {"$in": friend_ids}}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    for r in ratings:
        u = await db.users.find_one({"user_id": r["user_id"]}, {"_id": 0, "password_hash": 0})
        activities.append({
            "type": "rating",
            "rating_id": r["rating_id"],
            "user": u,
            "title": r["title"],
            "thumbnail": r["thumbnail"],
            "channel_name": r.get("channel_name", ""),
            "rating": r["rating"],
            "comment": r.get("comment", ""),
            "created_at": r["created_at"],
        })
    
    # Get friends' recent comments
    comments = await db.comments.find(
        {"user_id": {"$in": friend_ids}}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    for c in comments:
        u = await db.users.find_one({"user_id": c["user_id"]}, {"_id": 0, "password_hash": 0})
        rating = await db.video_ratings.find_one({"rating_id": c["rating_id"]}, {"_id": 0})
        if rating:
            activities.append({
                "type": "comment",
                "comment_id": c["comment_id"],
                "rating_id": c["rating_id"],
                "user": u,
                "text": c["text"],
                "video_title": rating.get("title", ""),
                "video_thumbnail": rating.get("thumbnail", ""),
                "created_at": c["created_at"],
            })
    
    # Sort by created_at descending
    activities.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    
    return activities[skip:skip+limit]

# --- Videos ---
@api_router.post("/videos/rate")
async def rate_video(data: VideoRateRequest, request: Request):
    user = await get_current_user(request)
    # Validate rating: must be between 0.5 and 5, in 0.5 increments
    if data.rating < 0.5 or data.rating > 5 or (data.rating * 2) % 1 != 0:
        raise HTTPException(400, "Rating must be between 0.5 and 5 in 0.5 increments (0.5, 1, 1.5, ..., 5)")
    
    youtube_info = await get_youtube_info(data.youtube_url)
    
    existing = await db.video_ratings.find_one({
        "user_id": user["user_id"], "youtube_id": youtube_info["youtube_id"]
    })
    
    if existing:
        await db.video_ratings.update_one(
            {"rating_id": existing["rating_id"]},
            {"$set": {"rating": data.rating, "comment": data.comment or "",
                      "updated_at": datetime.now(timezone.utc)}}
        )
        rating_id = existing["rating_id"]
    else:
        rating_id = f"rating_{uuid.uuid4().hex[:12]}"
        await db.video_ratings.insert_one({
            "rating_id": rating_id, "user_id": user["user_id"],
            "youtube_url": data.youtube_url, "youtube_id": youtube_info["youtube_id"],
            "title": youtube_info["title"], "thumbnail": youtube_info["thumbnail"],
            "channel_name": youtube_info["channel_name"],
            "rating": data.rating, "comment": data.comment or "",
            "created_at": datetime.now(timezone.utc),
            "like_count": 0
        })
        
        # Create notifications for all friends
        friendships = await db.friendships.find(
            {"$or": [{"user_id": user["user_id"]}, {"friend_id": user["user_id"]}]}, {"_id": 0}
        ).to_list(100)
        
        for f in friendships:
            friend_id = f["friend_id"] if f["user_id"] == user["user_id"] else f["user_id"]
            await create_notification(friend_id, NotificationType.FRIEND_RATED, {
                "rating_id": rating_id,
                "user_id": user["user_id"],
                "user_name": user.get("name", "Un ami"),
                "video_title": youtube_info["title"],
                "thumbnail": youtube_info["thumbnail"],
                "rating": data.rating
            })
    
    return {"rating_id": rating_id, **youtube_info, "rating": data.rating, "comment": data.comment or ""}

@api_router.get("/videos/feed")
async def get_feed(request: Request, skip: int = 0, limit: int = 20):
    user = await get_current_user(request)
    friendships = await db.friendships.find(
        {"$or": [{"user_id": user["user_id"]}, {"friend_id": user["user_id"]}]}, {"_id": 0}
    ).to_list(100)
    
    friend_ids = [user["user_id"]]
    for f in friendships:
        friend_ids.append(f["friend_id"] if f["user_id"] == user["user_id"] else f["user_id"])
    
    ratings = await db.video_ratings.find(
        {"user_id": {"$in": friend_ids}}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return await enrich_ratings(ratings)

@api_router.get("/videos/discover")
async def discover_videos(request: Request, skip: int = 0, limit: int = 20):
    await get_current_user(request)
    ratings = await db.video_ratings.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return await enrich_ratings(ratings)

@api_router.get("/videos/search")
async def search_videos(q: str, request: Request):
    await get_current_user(request)
    ratings = await db.video_ratings.find(
        {"title": {"$regex": q, "$options": "i"}}, {"_id": 0}
    ).limit(20).to_list(20)
    return await enrich_ratings(ratings)

# Top 3 of the Week - MUST be before /videos/{rating_id}
@api_router.get("/videos/top-week")
async def get_top_week(request: Request):
    # Get ratings from the last 7 days, sorted by like_count
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    top_ratings = await db.video_ratings.find(
        {"created_at": {"$gte": week_ago}},
        {"_id": 0}
    ).sort("like_count", -1).limit(3).to_list(3)
    
    # Enrich with user info
    enriched = []
    for r in top_ratings:
        user = await db.users.find_one({"user_id": r["user_id"]}, {"_id": 0, "password_hash": 0})
        enriched.append({**r, "user": user})
    
    return enriched

@api_router.get("/videos/user/{user_id}")
async def get_user_videos(user_id: str, request: Request):
    await get_current_user(request)
    ratings = await db.video_ratings.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return ratings

@api_router.get("/videos/{rating_id}")
async def get_video_detail(rating_id: str, request: Request):
    await get_current_user(request)
    rating = await db.video_ratings.find_one({"rating_id": rating_id}, {"_id": 0})
    if not rating:
        raise HTTPException(404, "Video rating not found")
    
    u = await db.users.find_one({"user_id": rating["user_id"]}, {"_id": 0, "password_hash": 0})
    if u:
        rating["user"] = u
    
    comments = await db.comments.find({"rating_id": rating_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for c in comments:
        cu = await db.users.find_one({"user_id": c["user_id"]}, {"_id": 0, "password_hash": 0})
        if cu:
            c["user"] = cu
    rating["comments"] = comments
    return rating

@api_router.post("/videos/{rating_id}/comments")
async def add_comment(rating_id: str, data: CommentCreate, request: Request):
    user = await get_current_user(request)
    rating = await db.video_ratings.find_one({"rating_id": rating_id})
    if not rating:
        raise HTTPException(404, "Video rating not found")
    
    comment_id = f"comment_{uuid.uuid4().hex[:12]}"
    await db.comments.insert_one({
        "comment_id": comment_id, "rating_id": rating_id,
        "user_id": user["user_id"], "text": data.text,
        "created_at": datetime.now(timezone.utc)
    })
    return {"comment_id": comment_id, "rating_id": rating_id, "user_id": user["user_id"],
            "text": data.text, "user": {"user_id": user["user_id"], "name": user["name"],
                                         "picture": user.get("picture", "")}}

# --- AI Recommendations ---
@api_router.get("/recommendations")
async def get_recommendations(request: Request):
    user = await get_current_user(request)
    user_ratings = await db.video_ratings.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("rating", -1).limit(10).to_list(10)
    
    if not user_ratings:
        popular = await db.video_ratings.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
        return {"ai_recommendations": [], "popular_videos": await enrich_ratings(popular)}
    
    try:
        video_list = "\n".join([f"- {r['title']} (rated {r['rating']}/5)" for r in user_ratings])
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"reco_{user['user_id']}_{uuid.uuid4().hex[:8]}",
            system_message="You are a YouTube video recommendation engine. Based on user's rated videos, suggest similar YouTube video topics. Return a JSON array of 5 objects with 'title' and 'reason' fields only. No markdown, only valid JSON."
        )
        chat.with_model("openai", "gpt-4o")
        msg = UserMessage(text=f"Based on these videos I've rated:\n{video_list}\n\nSuggest 5 YouTube video topics.")
        response = await chat.send_message(msg)
        
        try:
            recommendations = json.loads(response)
        except json.JSONDecodeError:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            recommendations = json.loads(json_match.group()) if json_match else []
        
        return {"ai_recommendations": recommendations,
                "based_on": [{"title": r["title"], "rating": r["rating"]} for r in user_ratings]}
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        popular = await db.video_ratings.find(
            {"user_id": {"$ne": user["user_id"]}}, {"_id": 0}
        ).sort("rating", -1).limit(10).to_list(10)
        return {"ai_recommendations": [], "popular_videos": await enrich_ratings(popular)}

# --- Playlists ---
MAX_PLAYLISTS = 15
MAX_VIDEOS_PER_PLAYLIST = 50

@api_router.post("/playlists")
async def create_playlist(data: PlaylistCreate, request: Request):
    user = await get_current_user(request)
    
    # Check max playlists limit
    count = await db.playlists.count_documents({"user_id": user["user_id"]})
    if count >= MAX_PLAYLISTS:
        raise HTTPException(400, f"Vous avez atteint la limite de {MAX_PLAYLISTS} playlists")
    
    playlist_id = f"playlist_{uuid.uuid4().hex[:12]}"
    playlist = {
        "playlist_id": playlist_id,
        "user_id": user["user_id"],
        "name": data.name.strip(),
        "description": data.description.strip() if data.description else "",
        "videos": [],
        "video_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.playlists.insert_one(playlist)
    del playlist["_id"]
    return playlist

@api_router.get("/playlists")
async def get_user_playlists(request: Request):
    user = await get_current_user(request)
    playlists = await db.playlists.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(MAX_PLAYLISTS)
    return playlists

@api_router.get("/playlists/{playlist_id}")
async def get_playlist(playlist_id: str, request: Request):
    await get_current_user(request)
    playlist = await db.playlists.find_one({"playlist_id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(404, "Playlist non trouvée")
    # Get owner info
    owner = await db.users.find_one({"user_id": playlist["user_id"]}, {"_id": 0, "password_hash": 0})
    if owner:
        playlist["owner"] = owner
    return playlist

@api_router.put("/playlists/{playlist_id}")
async def update_playlist(playlist_id: str, data: PlaylistUpdate, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"playlist_id": playlist_id, "user_id": user["user_id"]})
    if not playlist:
        raise HTTPException(404, "Playlist non trouvée")
    
    update = {"updated_at": datetime.now(timezone.utc)}
    if data.name is not None:
        update["name"] = data.name.strip()
    if data.description is not None:
        update["description"] = data.description.strip()
    
    await db.playlists.update_one({"playlist_id": playlist_id}, {"$set": update})
    return await db.playlists.find_one({"playlist_id": playlist_id}, {"_id": 0})

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.playlists.delete_one({"playlist_id": playlist_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(404, "Playlist non trouvée")
    return {"message": "Playlist supprimée"}

@api_router.post("/playlists/{playlist_id}/videos")
async def add_video_to_playlist(playlist_id: str, data: PlaylistAddVideo, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"playlist_id": playlist_id, "user_id": user["user_id"]})
    if not playlist:
        raise HTTPException(404, "Playlist non trouvée")
    
    # Check if video already in playlist
    for v in playlist.get("videos", []):
        if v["youtube_id"] == data.youtube_id:
            raise HTTPException(400, "Cette vidéo est déjà dans la playlist")
    
    # Check max videos limit
    if len(playlist.get("videos", [])) >= MAX_VIDEOS_PER_PLAYLIST:
        raise HTTPException(400, f"Limite de {MAX_VIDEOS_PER_PLAYLIST} vidéos par playlist atteinte")
    
    video_entry = {
        "youtube_id": data.youtube_id,
        "title": data.title,
        "thumbnail": data.thumbnail,
        "channel_name": data.channel_name or "",
        "added_at": datetime.now(timezone.utc)
    }
    
    await db.playlists.update_one(
        {"playlist_id": playlist_id},
        {
            "$push": {"videos": video_entry},
            "$inc": {"video_count": 1},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    return {"message": "Vidéo ajoutée", "video": video_entry}

@api_router.delete("/playlists/{playlist_id}/videos/{youtube_id}")
async def remove_video_from_playlist(playlist_id: str, youtube_id: str, request: Request):
    user = await get_current_user(request)
    playlist = await db.playlists.find_one({"playlist_id": playlist_id, "user_id": user["user_id"]})
    if not playlist:
        raise HTTPException(404, "Playlist non trouvée")
    
    await db.playlists.update_one(
        {"playlist_id": playlist_id},
        {
            "$pull": {"videos": {"youtube_id": youtube_id}},
            "$inc": {"video_count": -1},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    return {"message": "Vidéo retirée"}

# --- Likes ---
@api_router.post("/ratings/{rating_id}/like")
async def like_rating(rating_id: str, request: Request):
    user = await get_current_user(request)
    rating = await db.video_ratings.find_one({"rating_id": rating_id})
    if not rating:
        raise HTTPException(404, "Note non trouvée")
    
    # Check if already liked
    existing = await db.likes.find_one({"user_id": user["user_id"], "rating_id": rating_id})
    if existing:
        # Unlike
        await db.likes.delete_one({"user_id": user["user_id"], "rating_id": rating_id})
        await db.video_ratings.update_one({"rating_id": rating_id}, {"$inc": {"like_count": -1}})
        return {"liked": False, "like_count": max(0, rating.get("like_count", 1) - 1)}
    
    # Like
    await db.likes.insert_one({
        "like_id": f"like_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "rating_id": rating_id,
        "created_at": datetime.now(timezone.utc)
    })
    await db.video_ratings.update_one({"rating_id": rating_id}, {"$inc": {"like_count": 1}})
    
    return {"liked": True, "like_count": rating.get("like_count", 0) + 1}

@api_router.get("/ratings/{rating_id}/liked")
async def check_liked(rating_id: str, request: Request):
    user = await get_current_user(request)
    existing = await db.likes.find_one({"user_id": user["user_id"], "rating_id": rating_id})
    return {"liked": existing is not None}

# --- Badges ---
BADGES = {
    "apprenti_critique": {
        "id": "apprenti_critique",
        "name": "Apprenti Critique",
        "emoji": "🎬",
        "description": "A noté 5 vidéos",
        "threshold": 5
    },
    "accro_popcorn": {
        "id": "accro_popcorn",
        "name": "Accro au Pop-corn",
        "emoji": "🍿",
        "description": "3 notes en une journée",
        "threshold": 3
    },
    "influenceur": {
        "id": "influenceur",
        "name": "Influenceur",
        "emoji": "🌟",
        "description": "Une note avec 10+ likes",
        "threshold": 10
    }
}

@api_router.get("/users/{user_id}/badges")
async def get_user_badges(user_id: str, request: Request):
    badges = []
    
    # Badge: Apprenti Critique (5+ ratings)
    rating_count = await db.video_ratings.count_documents({"user_id": user_id})
    if rating_count >= BADGES["apprenti_critique"]["threshold"]:
        badges.append(BADGES["apprenti_critique"])
    
    # Badge: Accro au Pop-corn (3 ratings in one day)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = await db.video_ratings.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": today_start}
    })
    # Also check historical - any day with 3+ ratings
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gte": 3}}}
    ]
    days_with_3 = await db.video_ratings.aggregate(pipeline).to_list(1)
    if today_count >= 3 or len(days_with_3) > 0:
        badges.append(BADGES["accro_popcorn"])
    
    # Badge: Influenceur (a rating with 10+ likes)
    popular_rating = await db.video_ratings.find_one({
        "user_id": user_id,
        "like_count": {"$gte": BADGES["influenceur"]["threshold"]}
    })
    if popular_rating:
        badges.append(BADGES["influenceur"])
    
    return {"badges": badges, "stats": {"total_ratings": rating_count}}

# --- Notifications ---
async def create_notification(user_id: str, notif_type: str, data: dict):
    """Create a notification for a user"""
    notif = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": notif_type,
        "data": data,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notif)
    return notif

@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return notifs

@api_router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    user = await get_current_user(request)
    count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "read": False
    })
    return {"count": count}

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(request: Request):
    user = await get_current_user(request)
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}

# --- Health ---
@api_router.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
