# Generated by Django 5.1.7 on 2025-04-03 10:05

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0011_events_published_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='events',
            name='creator',
            field=models.ForeignKey(db_column='creator', null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, to_field='uuid'),
        ),
    ]
