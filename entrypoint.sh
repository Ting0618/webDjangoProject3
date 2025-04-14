#!/bin/sh

python manage.py migrate

echo "Checking for superuser '$DJANGO_SUPERUSER_USERNAME'..."
if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exit(0) if User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists() else exit(1)"; then
    echo "Superuser '$DJANGO_SUPERUSER_USERNAME' already exists. Skipping creation."
else
    if [ -z "$DJANGO_SUPERUSER_USERNAME" ] || [ -z "$DJANGO_SUPERUSER_PASSWORD" ]; then
        echo "Error: DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD must be set in environment variables to create a superuser."
        exit 1
    fi
    echo "Creating superuser '$DJANGO_SUPERUSER_USERNAME'..."
    python manage.py createsuperuser --noinput
    echo "Superuser '$DJANGO_SUPERUSER_USERNAME' creation process finished."
fi

exec "$@"