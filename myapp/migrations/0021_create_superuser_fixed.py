import os
from django.db import migrations
from django.core.exceptions import ImproperlyConfigured

# --- Function to create the superuser ---
def create_superuser(apps, schema_editor):
    User = apps.get_model('myapp', 'CustomUser')

    # --- Get Credentials from Environment Variables ---
    SUPERUSER_USERNAME = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    SUPERUSER_EMAIL = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    SUPERUSER_PASSWORD = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

    # Basic validation
    if not all([SUPERUSER_USERNAME, SUPERUSER_EMAIL, SUPERUSER_PASSWORD]):
        # In development, you might want to provide defaults or clearer errors
        # For production setup, raising an error is correct.
        print("\nWARNING: Missing superuser environment variables. Attempting defaults (DEV ONLY).")
        SUPERUSER_USERNAME = SUPERUSER_USERNAME or 'admin'
        SUPERUSER_EMAIL = SUPERUSER_EMAIL or 'admin@example.com'
        SUPERUSER_PASSWORD = SUPERUSER_PASSWORD # Password MUST be provided

        if not SUPERUSER_PASSWORD:
             raise ImproperlyConfigured(
                 "DJANGO_SUPERUSER_PASSWORD environment variable must be set."
            )

    # --- Check if user exists and Create ---
    # Using the model's default manager (objects)
    if not User.objects.filter(username=SUPERUSER_USERNAME).exists():
        print(f"\nCreating initial superuser: {SUPERUSER_USERNAME}")
        try:
            # Use the manager's create_superuser method
            User.objects.create_user(
                username=SUPERUSER_USERNAME,
                email=SUPERUSER_EMAIL,
                password=SUPERUSER_PASSWORD,
                role='admin',
                uuid='00000001',
                is_staff=True,
                is_superuser=True,
                # -------------------------------------------------------------
            )
            print(f"Superuser '{SUPERUSER_USERNAME}' created successfully.")
        except Exception as e:
            print(f"\nERROR creating superuser '{SUPERUSER_USERNAME}': {e}")
    else:
        print(f"\nSuperuser '{SUPERUSER_USERNAME}' already exists, skipping creation.")


def remove_superuser(apps, schema_editor):
    # Replace 'myapp' and 'CustomUser' with your details
    User = apps.get_model('myapp', 'CustomUser')
    SUPERUSER_USERNAME = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin') # Use same default logic if any

    try:
        # Be cautious deleting users, especially in reverse migrations
        user_to_delete = User.objects.get(
            username=SUPERUSER_USERNAME,
            is_superuser=True # Only delete if it's actually a superuser
        )
        print(f"\nAttempting to delete initial superuser: {SUPERUSER_USERNAME}")
        user_to_delete.delete()
        print(f"Superuser '{SUPERUSER_USERNAME}' deleted.")
    except User.DoesNotExist:
        print(f"\nSuperuser '{SUPERUSER_USERNAME}' not found for deletion.")
    except Exception as e:
        print(f"\nError deleting superuser '{SUPERUSER_USERNAME}': {e}")


# --- Migration Class ---
class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0018_commentlike'),
    ]
    # ---------------------------------

    operations = [
        migrations.RunPython(create_superuser, reverse_code=remove_superuser),
    ]