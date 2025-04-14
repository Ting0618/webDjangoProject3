# myapp/views/event_views.py
import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden, Http404  # Import HttpResponseForbidden
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
from ..models import Events # Use relative import from parent directory
from django.utils.dateparse import parse_datetime
from django.utils import timezone # Import timezone
from django.core.paginator import Paginator


@login_required
def event_management_view(request):
    """
    Displays the list of events.
    Admins see all events. Other users see only their own.
    """
    user = request.user
    is_admin = user.is_staff # Use is_staff to check for admin role

    if is_admin:
        events = Events.objects.all().order_by('-created_at')
    else:
        events = Events.objects.filter(creator=user).order_by('-created_at')

    # --- Pagination Logic ---
    # 1. Instantiate Paginator
    paginator = Paginator(events, 10)  # Show 10 events per page

    # 2. Get the requested page number from GET parameters
    page_number = request.GET.get('page')

    # 3. Get the Page object for the requested page number
    #    'get_page' handles invalid page numbers (e.g., non-integer, out of range)
    page_obj = paginator.get_page(page_number)

    context = {
        'events': page_obj,
        'is_admin': is_admin # Pass admin status to template
    }
    return render(request, 'myapp/contentManage.html', context) # Adjust template path



@login_required
def event_detail_api(request, event_id):
    """API endpoint to get details for a single event."""
    try:
        # Fetch the specific event
        event = get_object_or_404(Events, pk=event_id) # Use correct model name

        # Permission check (can user view this event?)
        # If non-admins can only edit their own:
        if not request.user.is_staff and event.creator != request.user:
            return JsonResponse({'error': 'Permission denied to view this event.'}, status=403)

        # Prepare data to send back as JSON
        data = {
            'id': event.id,
            'title': event.title,
            'creator_username': event.creator.username if event.creator else 'N/A', # Example, adjust as needed
            # Format date for datetime-local input and Quill content
            'scheduled_push_time': event.scheduled_push_time.strftime('%Y-%m-%dT%H:%M') if event.scheduled_push_time else '',
            'content': event.content, # Send raw HTML content for Quill
            'status': event.status,
            # Add any other fields needed in the modal
        }
        return JsonResponse(data)

    except Http404:
        return JsonResponse({'error': 'Event not found.'}, status=404)
    except Exception as e:
        print(f"Error fetching event detail: {e}") # Log error
        return JsonResponse({'error': 'An internal error occurred.'}, status=500)



@login_required
# Allow POST or PUT methods for update
@require_http_methods(["POST", "PUT"])
def event_update_api(request, event_id):
    """API endpoint to update an existing event."""
    try:
        # Fetch the event to update
        event = get_object_or_404(Events, pk=event_id) # Use model name

        # --- Permission Check  ---
        # Ensure only admins or the creator can update
        # Adjust this logic based on your exact requirements
        can_update = False
        if request.user.is_staff: # Admins can update any
             can_update = True
        elif event.creator == request.user and event.status == 'Draft': # Creator can update their own drafts?
             can_update = True
             # Maybe add logic here: non-admins cannot change status?

        if not can_update:
            return JsonResponse({'error': 'Permission denied to update this event.'}, status=403)

        # Parse incoming JSON data
        data = json.loads(request.body)

        # --- Data Validation (Similar to create, adapt as needed) ---
        title = data.get('title', '').strip()
        date_str = data.get('scheduled_push_time') # Use the key sent from JS
        content = data.get('content', '') # Quill content

        if not all([title, date_str, content]): # Basic check
            return JsonResponse({'status': 'error', 'message': 'Title, Scheduled Date, and Content are required.'}, status=400)

        naive_scheduled_date = parse_datetime(date_str)

        if not naive_scheduled_date:
             return JsonResponse({'status': 'error', 'message': 'Invalid date format.'}, status=400)

        scheduled_push_time = timezone.make_aware(naive_scheduled_date)

        # --- Update Event Fields ---
        event.title = title
        event.scheduled_push_time = scheduled_push_time
        event.content = content

        event.save() # Save the changes

        # --- Prepare Success Response ---
        # Return the updated data so the frontend can refresh
        response_data = {
            'success': True,
            'message': 'Event updated successfully!',
            'event': { # Send back data for table update
                'id': event.id,
                'title': event.title,
                'creator_username': event.creator.username if event.creator else 'N/A',
                'scheduled_push_time': event.scheduled_push_time.strftime('%Y-%m-%d %H:%M'), # Format for display
                'status': event.status
                # Include other fields displayed in the table
            }
        }
        return JsonResponse(response_data)

    except Http404:
        return JsonResponse({'error': 'Event not found.'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data.'}, status=400)
    except Exception as e:
        print(f"Error updating event {event_id}: {e}") # Log error
        # import traceback; traceback.print_exc() # For detailed debugging
        return JsonResponse({'error': 'An internal error occurred during update.'}, status=500)



@login_required
@require_POST
def create_event_view(request):
    """Handles the creation of a new event """
    try:
        data = json.loads(request.body)
        title = data.get('title')
        date_str = data.get('scheduled_push_time')
        content = data.get('content')

        if not all([title, date_str, content]):
            return JsonResponse({'status': 'error', 'message': 'Title, Date, and Content are required.'}, status=400)

        naive_scheduled_date = parse_datetime(date_str)

        if not naive_scheduled_date:
             return JsonResponse({'status': 'error', 'message': 'Invalid date format.'}, status=400)

        scheduled_push_time = timezone.make_aware(naive_scheduled_date)

        new_event = Events.objects.create(
            title=title,
            creator=request.user,
            scheduled_push_time=scheduled_push_time,
            content=content,
            status='Draft' # New events start as Draft
        )

        # Determine creator display name
        if hasattr(request.user, 'get_full_name') and request.user.get_full_name():
             creator_display_name = request.user.get_full_name()
        else:
             creator_display_name = request.user.username

        return JsonResponse({
            'status': 'success',
            'message': 'Event created successfully!',
            'event': {
                'id': new_event.id,
                'title': new_event.title,
                'creator_name': creator_display_name,
                'scheduled_push_time': new_event.scheduled_push_time.strftime('%Y-%m-%d %H:%M'),
                'status': new_event.status
            }
        }, status=201) # Use 201 Created status code

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data.'}, status=400)
    except Exception as e:
        print(f"Error creating event: {e}")
        return JsonResponse({'status': 'error', 'message': 'An internal error occurred.'}, status=500)


@login_required
def event_delete_api(request, event_id):
    """API endpoint to delete an event."""
    try:
        # Fetch the event to delete
        event = get_object_or_404(Events, pk=event_id) # Use correct model name

        # --- Permission Check (Crucial!) ---
        # Define who can delete (e.g., Admins or the creator)
        # Adjust this logic based on your exact requirements
        can_delete = False
        if request.user.is_staff: # Admins can delete any
             can_delete = True
        elif event.creator == request.user: # Creator can delete their own? Maybe only if Draft?
             # Add status check if needed: and event.status == 'Draft'
             can_delete = True

        if not can_delete:
            return JsonResponse({'error': 'Permission denied to delete this event.'}, status=403)

        # --- Perform Deletion ---
        event_title = event.title # Get title for response message before deleting
        event.delete()

        # --- Prepare Success Response ---
        # For DELETE, often a 204 No Content is returned, or a 200 OK with a success message
        return JsonResponse({
            'success': True,
            'message': f'Event "{event_title}" deleted successfully.'
        }) # Or return HttpResponse(status=204)

    except Http404:
        return JsonResponse({'error': 'Event not found.'}, status=404)
    except Exception as e:
        print(f"Error deleting event {event_id}: {e}") # Log error
        # import traceback; traceback.print_exc() # For detailed debugging
        return JsonResponse({'error': 'An internal error occurred during deletion.'}, status=500)


@login_required
@require_POST # Only allow POST requests for this action
def publish_event_view(request, event_id):
    """
    Publishes an event. Only accessible by admin users (is_staff).
    """
    # 1. Check Permissions (Essential Security Step)
    if not request.user.is_staff:
        # Return a 403 Forbidden error if user is not an admin
        # return HttpResponseForbidden("You do not have permission to publish events.")
        return JsonResponse({'status': 'error', 'message': 'Permission denied.'}, status=403)

    # 2. Get the Event
    event = get_object_or_404(Events, pk=event_id)

    # 3. Check if already published (optional, maybe return success anyway)
    if event.status == 'Published':
        return JsonResponse({
            'status': 'success',
            'message': 'Event is already published.',
            'event_status': event.status # Return current status
             })

    # 4. Update Status and Save
    event.status = 'Published'
    event.published_at = timezone.now() # Set publish time
    event.save(update_fields=['status', 'published_at', 'updated_at']) # Optimize save

    # 5. Return Success Response
    return JsonResponse({
        'status': 'success',
        'message': 'Event published successfully!',
        'event_status': event.status # Return the new status
        })

@login_required
@require_POST # Use POST for state change
def revoke_event_view(request, event_id):
    """Revokes a published event back to Draft. Only accessible by admins."""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Permission denied.'}, status=403)

    event = get_object_or_404(Events, pk=event_id)

    if event.status == 'Draft':
         return JsonResponse({
            'success': True, # Indicate success even if already draft
            'message': 'Event is already a draft.',
            'event_status': event.status
            })

    # Change status back to Draft
    event.status = 'Draft'
    # Optionally clear published_at if you have it
    if hasattr(event, 'published_at'):
        event.published_at = None
        event.save(update_fields=['status', 'published_at', 'updated_at'])
    else:
        event.save(update_fields=['status', 'updated_at'])

    return JsonResponse({
        'success': True, # Use 'success' consistently
        'message': 'Event revoked to draft successfully!',
        'event_status': event.status # Return the new status ('Draft')
        })

def employee_dashboard(request):
    print("===============employee_dashboard=================")
    # Fetch the latest 4 events, ordered by date or however you prefer
    latest_events = Events.objects.filter(
            status='published' # Filter ONLY by the 'published' status
        ).order_by('-scheduled_push_time')[:4]
    print("DEBUG: latest_events =", latest_events)
    context = {
        'latest_events': latest_events,
    }
    return render(request, 'myapp/home.html', context)

