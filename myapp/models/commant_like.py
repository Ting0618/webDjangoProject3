from django.db import models
from django.conf import settings
from django.db.models import UniqueConstraint


class CommentLike(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comment_likes',
        db_column='user_uuid',
        to_field='uuid',
    )
    comment = models.ForeignKey(
        'myapp.EventComment', # 替换成你的评论模型路径
        on_delete=models.CASCADE,
        related_name='likes'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            UniqueConstraint(fields=['user', 'comment'], name='unique_user_comment_like')
        ]
        ordering = ['-timestamp'] # 可选：默认按时间倒序
        db_table = 'comment_like'

    def __str__(self):
        # Example string representation
        try:
            user_identifier = self.user.username # Or self.user.email, etc.
        except AttributeError:
            user_identifier = f"User ID {self.user_id}" # Fallback
        return f"{user_identifier} liked Comment {self.comment_id}"