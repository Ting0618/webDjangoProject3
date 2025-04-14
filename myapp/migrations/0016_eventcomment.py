# Generated by Django 5.1.7 on 2025-04-04 21:47

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0015_alter_profile_avatar'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(db_column='author_uuid', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='event_comments', to=settings.AUTH_USER_MODEL, to_field='uuid')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='myapp.events')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='myapp.eventcomment')),
            ],
            options={
                'ordering': ['created_at'],
                'indexes': [models.Index(fields=['event', 'created_at'], name='myapp_event_event_i_0c297e_idx'), models.Index(fields=['author'], name='myapp_event_author__003445_idx')],
            },
        ),
    ]
