# myapp/models/__init__.py
from .events import Events
from .users import CustomUser
from .profile import Profile
from .event_commant import EventComment
from .commant_like import CommentLike

# 可选：定义 __all__，明确暴露的模型
__all__ = ['CustomUser', 'Events', 'Profile', 'EventComment', 'CommentLike']