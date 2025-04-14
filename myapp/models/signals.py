from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from myapp.models import (Profile) # Assuming Profile is in the same app ('users' or 'profiles')

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Create a Profile instance when a new User is created.
    """
    if created:
        Profile.objects.get_or_create(user=instance)