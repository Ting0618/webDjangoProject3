from django.contrib.auth.backends import BaseBackend
from myapp.models.users import CustomUser
from django.contrib.auth.hashers import check_password


class CustomAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # 查询用户
            user = CustomUser.objects.get(username=username)
            # 验证密码
            if check_password(password, user.password):
                return user
            return None
        except CustomUser.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return None