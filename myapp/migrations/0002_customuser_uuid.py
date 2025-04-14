from django.db import migrations, models
import random

def generate_unique_uuids(apps, schema_editor):
    CustomUser = apps.get_model('myapp', 'CustomUser')
    used_codes = set(CustomUser.objects.values_list('uuid', flat=True))

    def generate_code():
        while True:
            code = '{:08d}'.format(random.randint(0, 99999999))
            if code not in used_codes:
                used_codes.add(code)
                return code

    for user in CustomUser.objects.all():
        if not user.uuid:
            user.uuid = generate_code()
            user.save(update_fields=["uuid"])

class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='uuid',
            field=models.CharField(blank=True, null=True, max_length=8, unique=True),
        ),
        migrations.RunPython(generate_unique_uuids, reverse_code=migrations.RunPython.noop),  # ✅ 标记不可逆
        migrations.AlterField(
            model_name='customuser',
            name='uuid',
            field=models.CharField(blank=True, max_length=8, unique=True),
        ),
    ]