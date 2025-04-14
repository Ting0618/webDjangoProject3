from django.db import models
from django.conf import settings  # To reference settings.AUTH_USER_MODEL


# Helper function for dynamic upload path (optional but recommended)
def user_avatar_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/avatars/<user_uuid>/<filename>
    # Ensures unique paths even if filenames are the same.
    user_uuid_str = str(instance.user.uuid)  # Get the user's UUID string
    return f'avatars/{user_uuid_str}/{filename}'


class Profile(models.Model):
    # --- The Key Relationship ---
    # Links this Profile to exactly one User.
    # settings.AUTH_USER_MODEL refers to your CustomUser model safely.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # If user is deleted, delete profile too
        related_name='profile',  # Allows easy access: user_instance.profile
        to_field='uuid',  # Specify the field on CustomUser to link to
        db_column='user_uuid',
    )

    # --- Avatar Field ---
    avatar = models.ImageField(
        upload_to=user_avatar_path,  # Store images in user-specific folders
        null=True,  # Allow users without avatars
        blank=True,  # Allow empty value in forms/admin
        default='default_avatar.png'
    )

    def __str__(self):
        # Returns the username associated with this profile for easy identification
        # Assumes your CustomUser has a 'username' field
        try:
            return f"{self.user.username}'s Profile"
        except AttributeError:
            # Fallback if user somehow doesn't exist or lacks username
            return f"Profile linked to User UUID: {getattr(self.user, 'uuid', 'N/A')}"
        except Exception:
            # Broader fallback for unexpected issues during __str__
            return f"Profile object {self.pk}"
    class Meta:
        db_table = 'profile'