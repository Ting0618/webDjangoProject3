from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, AbstractUser, PermissionsMixin
import random
import string


class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)  # 使用 Django 的哈希密码
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    date = models.DateField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    zipcode = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    # 新增 uuid 字段
    uuid = models.CharField(max_length=8, unique=True)
    birthday = models.DateField(null=True, blank=True)
    date_joined = models.DateField(null=True, blank=True)
    ROLE_CHOICES = [
        ('staff', 'Staff'),
        ('hr3', 'HR Level 3'),
        ('hr2', 'HR Level 2'),
        ('hr1', 'HR Level 1'),
        ('admin', 'Admin'),
    ]
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    DEPARTMENT_CHOICES = [
        ('HR', 'HR'),
        ('IT', 'IT'),
        ('Marketing', 'Marketing'),
        ('Finance', 'Finance'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='staff')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, null=True)

    username = models.CharField(
        'username',
        max_length=150,
        unique=True,  # 添加 unique=True
        help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
        validators=[AbstractUser.username_validator],
        error_messages={
            'unique': "A user with that username already exists.",
        },
    )

    # Django 认证相关字段
    is_active = models.BooleanField(default=True)  # 是否活跃
    is_staff = models.BooleanField(default=False)  # 是否为员工
    is_superuser = models.BooleanField(default=False)  # 是否为超级用户

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'  # 用于登录的字段

    class Meta:
        db_table = 'users'

    def save(self, *args, **kwargs):
        # 如果 uuid 为空（即新记录），自动生成 8 位数字
        if not self.uuid:
            self.uuid = ''.join(random.choices(string.digits, k=8))
            # 确保生成的 uuid 是唯一的
            while CustomUser.objects.filter(uuid=self.uuid).exists():
                self.uuid = ''.join(random.choices(string.digits, k=8))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

    # 实现 AbstractBaseUser 要求的属性
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False