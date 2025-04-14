# Generated by Django 5.1.7 on 2025-04-04 22:10

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0017_rename_myapp_event_event_i_0c297e_idx_event_comme_event_i_72cbde_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommentLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('comment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='myapp.eventcomment')),
                ('user', models.ForeignKey(db_column='user_uuid', on_delete=django.db.models.deletion.CASCADE, related_name='comment_likes', to=settings.AUTH_USER_MODEL, to_field='uuid')),
            ],
            options={
                'db_table': 'comment_like',
                'ordering': ['-timestamp'],
                'constraints': [models.UniqueConstraint(fields=('user', 'comment'), name='unique_user_comment_like')],
            },
        ),
    ]
