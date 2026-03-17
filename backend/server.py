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
    rating: int
    comment: Optional[str] = ""

class CommentCreate(BaseModel):
    text: str

class FriendRequestCreate(BaseModel):
    to_user_id: str

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

# --- Videos ---
@api_router.post("/videos/rate")
async def rate_video(data: VideoRateRequest, request: Request):
    user = await get_current_user(request)
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    
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
            "created_at": datetime.now(timezone.utc)
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
