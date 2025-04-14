from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, Http404
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, update_session_auth_hash
from django.contrib import messages
import logging
from django.urls import reverse # To generate redirect URL
from myapp.form import CustomLoginForm, EmployeeForm, CustomPasswordChangeForm, AvatarChangeForm
# NEW API View to handle AJAX POST requests
from django.views.decorators.http import require_http_methods
from myapp.models import Events, Profile


def login_view(request):
    if request.method == 'POST':
        form = CustomLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f"welcome back {username}！")
                return redirect('main')
            else:
                messages.error(request, "username or password is incorrect")
        else:
            messages.error(request, "form is invalid")
    else:
        form = CustomLoginForm()

    return render(request, 'myapp/login.html', {'form': form})



def register_view(request):
    form = EmployeeForm()
    return render(request, 'myapp/register.html', {'form': form})


@require_http_methods(["POST"]) # Only allow POST
def register_api(request):
    # Use a Django Form for validation - MUCH BETTER than manual checks
    form = EmployeeForm(request.POST)
    if form.is_valid():
        try:
            # Form's save method handles user creation and potentially other fields
            user = form.save(commit=False)

            # Optionally save extra fields not handled by the form's save() method
            # Example (if 'date' etc. are not directly on the form but still in POST):
            user.username = form.cleaned_data.get('username')
            user.birthday = form.cleaned_data.get('birthday') # Or request.POST.get('date') if not on form
            user.gender = form.cleaned_data.get('gender')
            user.department = form.cleaned_data.get('department')
            user.email = form.cleaned_data.get('email')
            user.phone = form.cleaned_data.get('phone')
            user.address = form.cleaned_data.get('address')
            user.city = form.cleaned_data.get('city')
            user.country = form.cleaned_data.get('country')
            user.zipcode = form.cleaned_data.get('zipcode')
            password = form.cleaned_data.get("password")
            user.role = form.cleaned_data.get('role')
            if password:
                user.set_password(password)  # This handles the hashing!

            # date_joined is usually handled automatically or by create_user
            user.save() # Save again if you modified fields after form.save()

            # Generate the URL for the login page
            login_url = reverse('login') # Use the name of your login URL pattern

            return JsonResponse({
                'success': True,
                'message': 'Registration successful!',
                'redirect_url': login_url
            })
        except Exception as e:
             # Catch potential errors during save
             logging.error(f"Error during user save: {e}", exc_info=True) # Assumes logger is configured
             return JsonResponse({
                 'success': False,
                 'message': f'An internal error occurred during registration: {str(e)}'
             }, status=500)

    else:
        # Form validation failed
        return JsonResponse({
            'success': False,
            'message': 'Please correct the errors below.',
            'errors': form.errors # Send form errors back to JS
        }, status=400) # Bad Request status


@login_required
def main_view(request):
    context = {}  # No specific data needed for main.html itself in this example
    return render(request, 'myapp/main.html', context)

@login_required
def home_view(request):
    # Fetch data needed for the included 'home.html' content
    try:
        latest_events = Events.objects.filter(
            status='Published' # Filter ONLY by the 'published' status
        ).order_by('-scheduled_push_time')[:4]
    except Exception as e:
        print(f"Error fetching events for main page: {e}")
        latest_events = []

    context = {
        'latest_events': latest_events,
    }
    # Render the home.html template for the iframe
    return render(request, 'myapp/home.html', context)

def coming_view(request):
    return render(request, 'myapp/comingSoon.html', {'user': request.user})

@login_required
def content_manage_view(request):
    return render(request, 'myapp/contentManage.html', {'user': request.user})

@login_required
def settings_view(request):
    # Ensure profile exists, create if not (using the signal is better, but as a fallback)
    profile, created = Profile.objects.get_or_create(user=request.user)
    password_form = CustomPasswordChangeForm(request.user)
    # Pass instance to ensure current avatar is linked if form needs validation feedback
    avatar_form = AvatarChangeForm(instance=profile)

    if request.method == 'POST':
        if 'submit_avatar' in request.POST:
            avatar_form = AvatarChangeForm(request.POST, request.FILES, instance=profile)
            if avatar_form.is_valid():
                if 'avatar' in request.FILES:
                    avatar_form.save()
                    # Use a specific message text we can check in JS
                    messages.success(request, 'AVATAR_UPDATE_SUCCESS')
                else:
                    messages.info(request, 'No new avatar selected.')  # Keep this general
                # Redirect is crucial for PRG pattern and allows simple refresh
                return redirect('settings')
            else:
                # Form is invalid (could be size error or other)
                # Django automatically adds form.errors to the context when rendering
                # We can check for specific errors in JS if needed, but let's rely on form display first
                messages.error(request, 'Avatar update failed. Please check errors below.')  # Generic error

        elif 'submit_password' in request.POST:
            password_form = CustomPasswordChangeForm(request.user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)
                # Use a specific message text we can check in JS
                messages.success(request, 'PASSWORD_CHANGE_SUCCESS')
                return redirect('settings')  # Redirect back to settings page
            else:
                # Password form already displays specific errors (wrong old pw, mismatch)
                messages.error(request, 'Password change failed. Please check errors below.')  # Generic error

    # Prepare context for GET or if forms were invalid on POST
    context = {
        'avatar_form': avatar_form,  # Will contain errors if invalid
        'password_form': password_form,  # Will contain errors if invalid
        'profile': profile  # Pass profile to show current avatar (refreshed on reload)
    }
    return render(request, 'myapp/settings.html', context)
