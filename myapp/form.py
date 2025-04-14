from django import forms
from django.contrib.auth.forms import AuthenticationForm
from myapp.models import *
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.forms import PasswordChangeForm as DjangoPasswordChangeForm
from django.utils.translation import gettext_lazy as _ # For translatable error messages





class LoginForm(AuthenticationForm):
    username = forms.CharField(label="用户名", max_length=254)
    password = forms.CharField(label="密码", widget=forms.PasswordInput)


class CustomLoginForm(forms.Form):
    username = forms.CharField(
        label="用户名",
        max_length=255,
        widget=forms.TextInput(attrs={
            'placeholder': ' ',  # 空格占位符，触发 CSS 效果
            'required': 'required'
        })
    )
    password = forms.CharField(
        label="密码",
        widget=forms.PasswordInput(attrs={
            'placeholder': ' ',  # 空格占位符
            'required': 'required'
        })
    )


class CustomRegisterForm(forms.Form):
    username = forms.CharField(
        label="用户名",
        max_length=255,
        widget=forms.TextInput(attrs={'placeholder': ' ', 'required': 'required'})
    )
    password = forms.CharField(
        label="密码",
        widget=forms.PasswordInput(attrs={'placeholder': ' ', 'required': 'required'})
    )
    confirm_password = forms.CharField(
        label="确认密码",
        widget=forms.PasswordInput(attrs={'placeholder': ' ', 'required': 'required'})
    )
    role = forms.ChoiceField(
        label="角色",
        choices=[('user', '用户'), ('admin', '管理员')],
        widget=forms.Select(attrs={'required': 'required'})
    )

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError("两次输入的密码不一致")
        return cleaned_data



class EmployeeForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        # Specify the fields you want to be editable
        # Exclude sensitive fields like 'password', 'last_login', 'is_superuser', etc.
        # Make sure 'uuid' is NOT included here if it's auto-generated or shouldn't be edited.
        fields = [
            'username',
            'birthday',
            'email',
            'gender',
            'department',
            'phone',
            'city',
            'country',
            'address',
            'zipcode',
            'password',
            'role',
            'is_active', # You might want to control if the user is active
            'is_staff', # Control staff status if applicable
        ]

class EmployeeAddForm(UserCreationForm): # Inherit for password handling
    # Add fields required for creating a new employee that aren't in UserCreationForm
    # Ensure these match the fields you expect on the Add Employee page
    birthday = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=True, label="Birthday") # Changed from 'date' for clarity
    gender = forms.ChoiceField(choices=CustomUser.GENDER_CHOICES, required=True) # Assuming choices on model
    department = forms.ChoiceField(choices=CustomUser.DEPARTMENT_CHOICES, required=True) # Assuming choices on model
    role = forms.ChoiceField(choices=CustomUser.ROLE_CHOICES, required=True)  # Example: Add role if applicable
    phone = forms.CharField(max_length=20, required=True)
    address = forms.CharField(required=True)
    city = forms.CharField(max_length=100, required=True)
    country = forms.CharField(max_length=100, required=True)
    zipcode = forms.CharField(max_length=20, required=True)
    date = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}), required=True)

    # --- Set is_staff based on the updated role ---
    if role == 'Admin':
        is_staff = True
    else:
        is_staff = False
    # is_active = forms.BooleanField(required=False, initial=True) # Default to active?
    # is_staff = forms.BooleanField(required=False) # Control staff status
    email = forms.CharField(required=True)
    username = forms.CharField(required=True)

    class Meta(UserCreationForm.Meta):
        model = CustomUser
        # List all fields needed from UserCreationForm PLUS your custom ones
        fields = UserCreationForm.Meta.fields + (
            'email', # Ensure email is included if required
            'birthday', 'gender', 'department', 'phone',
            'address', 'city', 'country', 'zipcode',
            'role', 'date', 'username'
            )




# Form to handle avatar uploads
class AvatarChangeForm(forms.ModelForm):
    avatar = forms.ImageField(
        required=False,
        widget=forms.FileInput,
        help_text=_('Maximum file size: 500KB')  # Add help text for user
    )

    class Meta:
        model = Profile
        fields = ['avatar']

    def clean_avatar(self):
        avatar = self.cleaned_data.get('avatar')

        if avatar:
            # Define max size in bytes (500 KB * 1024 B/KB)
            max_upload_size = 500 * 1024

            if avatar.size > max_upload_size:
                # Raise a validation error that will be shown to the user
                raise forms.ValidationError(
                    _('File size cannot exceed 500KB. Your file size is %(size).1f KB.'),
                    params={'size': avatar.size / 1024},  # Pass size in KB to message
                    code='filesize'  # Optional code for specific error handling
                )
        return avatar


# Customize the built-in password change form if needed (e.g., add CSS classes)
# Often, using it directly is fine.
class CustomPasswordChangeForm(DjangoPasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Optional: Add CSS classes to fields for styling
        for fieldname in ['old_password', 'new_password1', 'new_password2']:
            self.fields[fieldname].widget.attrs.update({'class': 'form-control'})