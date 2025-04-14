from django.urls import path
# 引入event_views
from .views import event_views, employee_views, general_views, comments_view
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static


# app_name = 'myapp'
urlpatterns = [
    path('login/', general_views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='/login/'), name='logout'),
    path('', general_views.login_view, name='login'),
    path('main/', general_views.main_view, name='main'),
    path('home/', general_views.home_view, name='home'),
    path('login/register/', general_views.register_view, name='register'),
    path('api/register/', general_views.register_api, name='register_api'), # Handles AJAX POST
    path('comingSoon/', general_views.coming_view, name='comingSoon'),
    path('content_manage/', general_views.content_manage_view, name='content_manage'),
    path('employee/', employee_views.employee_view, name='employee'),
    path('employee/edit/<str:employee_uuid>/', employee_views.edit_employee_view, name='edit_employee'),
    path('employee/delete/<str:employee_uuid>/', employee_views.delete_employee_view, name='delete_employee'),
    path('employee/details/<str:employee_uuid>/', employee_views.details_employee_view, name='details_employee'),
    path('employee/add/', employee_views.add_employee_view, name='add_employee'),
    path('employee/', employee_views.employee_view, name='employee_list'),
    # --- API Endpoint ---
    # Returns JSON data for a specific employee
    path('api/employee/<str:employee_uuid>/', employee_views.employee_detail_api, name='employee_detail_api'),
    path('api/employees/<str:employee_uuid>/delete/', employee_views.employee_delete_api, name='employee_delete_api'),
    path('employee/<str:employee_uuid>/update/', employee_views.employee_update_api, name='employee_update_api'),

    # URL for the main event management page (displaying the list)
    path('event-management/', event_views.event_management_view, name='event_management'),

    # URL endpoint for creating an event (handling the POST request from JS)
    path('events/create/', event_views.create_event_view, name='create_event_api'),
    # Takes the event ID as part of the URL
    path('events/<int:event_id>/publish/', event_views.publish_event_view, name='publish_event_api'),
    # URL to get event details
    path('events/<int:event_id>/detail/', event_views.event_detail_api, name='event_detail_api'),
    # URL to update event details
    path('events/<int:event_id>/update/', event_views.event_update_api, name='event_update_api'),
    # URL to delete an event (e.g., /events/10/delete/)
    path('events/<int:event_id>/delete/', event_views.event_delete_api, name='event_delete_api'),
    # --- URL for Revoke ---
    path('events/<int:event_id>/revoke/', event_views.revoke_event_view, name='revoke_event_api'),

    path('dashboard/', event_views.employee_dashboard, name='employee_dashboard'),
    path('events/<int:event_id>/comments/', comments_view.event_comments_view, name='event_comments'),
    path('events/<int:event_id>/add_comment/', comments_view.add_event_comment_view, name='add_event_comment'),
    path('comments/<int:comment_id>/like/', comments_view.like_comment_api_view, name='like_comment_api'),
    path('settings/', general_views.settings_view, name='settings'),

]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)