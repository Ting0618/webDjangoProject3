from django.db import models
from django.conf import settings


class EventComment(models.Model):
    # id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) # Optional UUID PK
    event = models.ForeignKey(
        'myapp.Events', # Replace 'myapp.Event' with your actual Event model path
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # Keep comment if user is deleted
        null=True,
        to_field='uuid',
        blank=False, # Require an author for new comments
        related_name='event_comments',
        db_column='author_uuid'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies' # comment.replies.all()
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True) # Add index for ordering
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Order comments by creation date by default
        ordering = ['created_at']
        # Add indexes for faster filtering/lookup
        indexes = [
            models.Index(fields=['event', 'created_at']),
            models.Index(fields=['author']),
        ]
        db_table = 'event_comment'


    def __str__(self):
        # String representation for admin/debugging
        try:
            author_name = self.author.username if self.author else 'Deleted User'
        except AttributeError:
            author_name = 'Unknown User' # Fallback if username field differs

        return f"Comment by {author_name} on {self.event.title[:20]} ({self.created_at.strftime('%Y-%m-%d')})"

    # Optional: Property to check if it's a top-level comment
    @property
    def is_top_level(self):
        return self.parent is None
