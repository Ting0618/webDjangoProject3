# myapp/views.py
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST

from myapp.models import Events, EventComment, CommentLike # Import CommentLike
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Exists, OuterRef # Import annotation tools
from django.db import models



@login_required()
def event_comments_view(request, event_id):
    event = get_object_or_404(Events, pk=event_id)

    # Annotate comments with like count and if the current user liked it
    comments_qs = EventComment.objects.filter(
        event=event,
        parent__isnull=True  # Get only top-level comments initially
    ).select_related('author', 'author__profile')  # Optimize fetching author and profile

    # Annotate with the count of likes
    comments_qs = comments_qs.annotate(
        like_count=Count('likes')  # Count related CommentLike objects
    )

    # Annotate with whether the current logged-in user has liked this comment
    if request.user.is_authenticated:
        user_likes = CommentLike.objects.filter(
            comment=OuterRef('pk'),  # Refer to the comment being annotated
            user=request.user
        )
        comments_qs = comments_qs.annotate(
            is_liked_by_user=Exists(user_likes)  # Returns True if a like exists, False otherwise
        )
    else:
        # If user is not logged in, they haven't liked anything
        comments_qs = comments_qs.annotate(
            is_liked_by_user=models.Value(False, output_field=models.BooleanField())
        )

    comments = comments_qs.order_by('created_at')  # Apply ordering after annotation

    context = {
        'event': event,
        'comments': comments,  # Pass the annotated queryset
        # 'comment_form': CommentForm() # If using a form
    }
    return render(request, 'myapp/event_comments.html', context)



@login_required # Comments should typically require login
def add_event_comment_view(request, event_id):
    # Get the event object this comment belongs to
    event = get_object_or_404(Events, pk=event_id)

    if request.method == 'POST':
        # Option 1: Simple handling (without a Django Form)
        content = request.POST.get('content') # Get content from textarea name
        parent_id = request.POST.get('parent_id') # Get parent_id if handling replies

        if content: # Basic validation: ensure content is not empty
            parent_comment = None
            if parent_id:
                try:
                    parent_comment = EventComment.objects.get(pk=parent_id)
                    # Optional: Check if parent belongs to the same event for consistency
                    if parent_comment.event != event:
                        parent_comment = None # Ignore invalid parent
                except EventComment.DoesNotExist:
                    parent_comment = None

            EventComment.objects.create(
                event=event,
                author=request.user,
                content=content,
                parent=parent_comment # Set parent if valid ID was provided
            )
            messages.success(request, 'Comment posted successfully!')
            # Redirect back to the event comments page after posting
            return redirect('event_comments', event_id=event.id)
        else:
            messages.error(request, 'Comment content cannot be empty.')
            # Redirect back even if there's an error (or re-render with form errors if using Django Forms)
            return redirect('event_comments', event_id=event.id)

        # Option 2: Using a Django Form (Recommended for better validation)
        # form = CommentForm(request.POST)
        # if form.is_valid():
        #     new_comment = form.save(commit=False)
        #     new_comment.event = event
        #     new_comment.author = request.user
        #     # Handle parent logic here if using form for replies
        #     new_comment.save()
        #     messages.success(request, 'Comment posted successfully!')
        #     return redirect('event_comments', event_id=event.id)
        # else:
        #     # If form is invalid, ideally re-render event_comments page
        #     # with the form containing errors. This requires passing the
        #     # invalid form back in the context.
        #     messages.error(request, 'Please correct the errors below.')
        #     # Fetch comments again for re-rendering
        #     comments = event.comments.filter(parent__isnull=True).order_by('created_at')
        #     context = {'event': event, 'comments': comments, 'comment_form': form}
        #     return render(request, 'myapp/event_comments.html', context)

    else:
        # If someone tries to access this URL via GET, just redirect them
        return redirect('event_comments', event_id=event.id)


@login_required # User must be logged in to like
@require_POST   # Only allow POST requests for this action
def like_comment_api_view(request, comment_id):
    # Find the comment
    comment = get_object_or_404(EventComment, pk=comment_id)
    user = request.user

    # Check if the user has already liked this comment
    like_instance, created = CommentLike.objects.get_or_create(
        user=user,
        comment=comment
        # Defaults are handled automatically (timestamp)
    )

    action = None
    if created:
        # Like was just added
        action = 'liked'
    else:
        # Like already existed, so delete it (unlike)
        like_instance.delete()
        action = 'unliked'

    # Get the updated like count for this comment
    new_like_count = comment.likes.count() # Efficient way using related_name

    # Return a JSON response
    return JsonResponse({
        'success': True,
        'action': action, # 'liked' or 'unliked'
        'like_count': new_like_count
    })