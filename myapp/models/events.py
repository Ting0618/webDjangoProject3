from django.db import models


class Events(models.Model):
    PUSH_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('pushed', 'Pushed'),
        ('revoked', 'Revoked'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()  # 存储 HTML 富文本内容
    scheduled_push_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=PUSH_STATUS_CHOICES,
        default='draft'
    )

    creator = models.ForeignKey(
        'myapp.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        db_column='creator',
        to_field='uuid'
    )

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'events'