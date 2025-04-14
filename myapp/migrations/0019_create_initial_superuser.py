# myapp/migrations/0019_create_initial_superuser.py
from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    User = apps.get_model('myapp', 'CustomUser')
    SUPERUSER_USERNAME = 'admin'
    SUPERUSER_EMAIL = 'admin@example.com'  # 可选，允许为空
    SUPERUSER_PASSWORD = '123123..'  # 请替换为实际密码

    if not User.objects.filter(username=SUPERUSER_USERNAME).exists():
        print(f"\nCreating initial superuser: {SUPERUSER_USERNAME}")
        hashed_password = make_password(SUPERUSER_PASSWORD)
        try:
            user = User(
                username=SUPERUSER_USERNAME,
                email=SUPERUSER_EMAIL,  # 可选字段
                is_staff=True,          # 必填
                is_superuser=True,      # 必填
                is_active=True,         # 必填
                role='admin',           # 必填
                uuid='00000001',        # 必填
                password=hashed_password,
            )
            # user.set_password(SUPERUSER_PASSWORD)
            user.save(using=schema_editor.connection.alias)
            print(f"Superuser '{SUPERUSER_USERNAME}' created successfully.")
        except Exception as e:
            print(f"\nERROR creating superuser '{SUPERUSER_USERNAME}': {e}")
    else:
        print(f"\nSuperuser '{SUPERUSER_USERNAME}' already exists, skipping creation.")

def remove_superuser(apps, schema_editor):
    User = apps.get_model('myapp', 'CustomUser')
    SUPERUSER_USERNAME = 'admin'
    try:
        user_to_delete = User.objects.get(username=SUPERUSER_USERNAME, is_superuser=True)
        user_to_delete.delete()
        print(f"Superuser '{SUPERUSER_USERNAME}' deleted.")
    except User.DoesNotExist:
        print(f"Superuser '{SUPERUSER_USERNAME}' not found for deletion.")
    except Exception as e:
        print(f"Error deleting superuser '{SUPERUSER_USERNAME}': {e}")

class Migration(migrations.Migration):
    dependencies = [('myapp', '0018_commentlike')]
    operations = [migrations.RunPython(create_superuser, reverse_code=remove_superuser)]





