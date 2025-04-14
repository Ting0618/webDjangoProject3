from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.http import JsonResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
import json
from datetime import datetime
import logging # Optional: for logging errors
from django.views.decorators.csrf import csrf_protect
from myapp.form import EmployeeForm, EmployeeAddForm
from myapp.models.users import CustomUser
# NEW API View to handle AJAX POST requests
from django.views.decorators.http import require_http_methods


def employee_view(request):
    # 1. 获取所有员工的基础查询集
    employee_queryset = CustomUser.objects.all()

    # 2. 应用筛选条件 (从 GET 请求参数获取)
    employee_uuid = request.GET.get('uuid')
    username = request.GET.get('username')
    department = request.GET.get('department')
    role = request.GET.get('role')
    gender = request.GET.get('gender')

    if employee_uuid:
        # 使用 isnumeric() 检查确保是数字，防止非数字查询导致错误
        employee_queryset = employee_queryset.filter(uuid=employee_uuid)
        # else: 可以选择忽略无效输入或返回错误消息

    if username:
        # 使用 __icontains 进行不区分大小写的包含搜索
        employee_queryset = employee_queryset.filter(username__icontains=username)

    if department:
        employee_queryset = employee_queryset.filter(department=department)

    if role:
        employee_queryset = employee_queryset.filter(role__iexact=role)

    if gender:
        employee_queryset = employee_queryset.filter(gender__iexact=gender)

    employee_queryset = employee_queryset.order_by('id')
    # 3. 设置分页
    paginator = Paginator(employee_queryset, 10)  # 每页显示 10 条员工信息
    page_number = request.GET.get('page')  # 从 GET 请求获取页码

    try:
        employees_page = paginator.page(page_number)
    except PageNotAnInteger:
        # 如果页码不是整数，显示第一页
        employees_page = paginator.page(1)
    except EmptyPage:
        # 如果页码超出范围，显示最后一页
        employees_page = paginator.page(paginator.num_pages)

    # 4. 创建上下文 (Context) 字典
    # 这个字典包含了要传递给模板的数据
    context = {
        'employees': employees_page,  # 将分页后的 Page 对象传递给模板
        # 'request': request # request 对象通常通过 context processors 自动传递，但明确传递也没问题
    }

    # 5. 渲染模板
    # 'yourapp/employee_list_template.html' 是你模板文件的路径
    return render(request, 'myapp/employee.html', context)


@login_required
def edit_employee_view(request, employee_uuid):
    employee = get_object_or_404(CustomUser, uuid=employee_uuid)

    if request.method == 'POST':
        # Pass instance=employee to update the existing object
        form = EmployeeForm(request.POST, instance=employee)
        if form.is_valid():
            form.save()
            messages.success(request, f"Employee '{employee.username}' updated successfully!")
            # Redirect to the detail page or the list page
            return redirect('details_employee', employee_uuid=employee.uuid)
            # Or: return redirect('myapp:employee_list')
        else:
            # Form is not valid, errors will be bound to the form instance
            messages.error(request, "Please correct the errors below.")
    else:  # GET request
        # Populate the form with the employee's current data
        form = EmployeeForm(instance=employee)

    context = {
        'form': form,
        'employee': employee,  # Pass employee for context
        'user': request.user
    }
    return render(request, 'myapp/edit_employee.html', context)

@login_required
def delete_employee_view(request, employee_uuid):
    pass


@login_required
@csrf_protect # Ensures CSRF token is checked
@require_http_methods(["DELETE"]) # Only allow DELETE method
def employee_delete_api(request, employee_uuid):
    """
    API endpoint to delete an employee. Handles DELETE requests.
    """
    try:
        employee = get_object_or_404(CustomUser, uuid=employee_uuid)
        employee_name = employee.username # Get name for logging/response before delete
        employee.delete()
        logging.info(f"Successfully deleted employee '{employee_name}' (UUID: {employee_uuid}) by user {request.user.username}")
        # Return success - 204 No Content is also appropriate for DELETE
        # Or return JSON:
        return JsonResponse({'success': True, 'message': f"Employee '{employee_name}' deleted successfully."})
        # return HttpResponse(status=204) # Alternative: 204 No Content

    except Http404:
        logging.warning(f"Attempt to delete non-existent employee (UUID: {employee_uuid}) by user {request.user.username}")
        return JsonResponse({'success': False, 'error': 'Employee not found.'}, status=404)
    except Exception as e:
        logging.error(f"Error deleting employee (UUID: {employee_uuid}) by user {request.user.username}: {e}", exc_info=True)
        return JsonResponse({'success': False, 'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@login_required
def details_employee_view(request, employee_uuid):
    # Fetch the specific employee using the uuid string, or return 404
    employee = get_object_or_404(CustomUser, uuid=employee_uuid)
    context = {
        'employee': employee,
        'user': request.user  # Pass user if needed by base template
    }
    return render(request, 'myapp/edit_employee.html', context)


@login_required # Protect the API endpoint
def employee_detail_api(request, employee_uuid):
    try:
        employee = get_object_or_404(CustomUser, uuid=employee_uuid)
        # Create a dictionary with the data needed for the modal
        data = {
            'success': True, # Indicate success
            'uuid': employee.uuid,
            'username': employee.username,
            'email': employee.email,
            # Use get_FIELD_display() for fields with choices if available and preferred
            'gender': getattr(employee, 'get_gender_display', lambda: employee.gender)(), # Safer way to call get_..._display
            'department': employee.department,
            'role': employee.role,
            'is_staff': employee.is_staff,
            'phone': employee.phone,
            'country': employee.country,
            'is_active': employee.is_active,
            'date': employee.date.strftime('%Y-%m-%d') if employee.date else None, # Format date
            'birthday': employee.birthday.strftime('%Y-%m-%d') if employee.birthday else 'N/A',  # format birthday
        }
        return JsonResponse(data)
    except Exception as e:
        # Return an error response if something goes wrong
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@login_required # Ensure only logged-in users (e.g., admins) can add employees
@require_http_methods(["GET", "POST"]) # Allow GET for initial load, POST for submit
def add_employee_view(request):
    if request.method == 'POST':
        # Check if it's an AJAX request (optional but good practice)
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        form = EmployeeAddForm(request.POST)

        if form.is_valid():
            try:
                new_employee = form.save()
                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'message': f"Successfully added employee: {new_employee.username}"
                    })
                else:
                    # Fallback for non-JS submission (optional)
                    messages.success(request, f"Successfully added employee: {new_employee.username}")
                    return redirect('add_employee')  # Redirect back to clear form

            except Exception as e:
                logging.error(f"Error adding employee: {e}", exc_info=True)
                error_message = f"An error occurred: {e}"
                if is_ajax:
                    return JsonResponse({'success': False, 'message': error_message}, status=500)
                else:
                    messages.error(request, error_message)
                    # Fall through to render with original form containing errors
        else:
            # Form is invalid
            if is_ajax:
                return JsonResponse({
                    'success': False,
                    'message': 'Please correct the errors below.',
                    'errors': form.errors
                }, status=400)
            else:
                # Non-AJAX: Fall through to render template with form containing errors
                messages.error(request, "Please correct the errors highlighted below.")

        # --- Handles GET requests or non-AJAX POST errors ---
        # If it was an invalid non-AJAX POST, 'form' will contain errors
        # Otherwise (GET request), create a new empty form
    if request.method == 'GET' or 'form' not in locals():
        form = EmployeeAddForm()

    context = {
        'form': form,
        'user': request.user
    }
    return render(request, 'myapp/add_employee.html', context)


@csrf_protect # Ensure CSRF protection
@login_required # Make sure user is logged in
@require_http_methods(["POST"]) # Use POST for this action
def employee_update_api(request, employee_uuid):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=405)

    new_role = request.POST.get('role')
    if new_role == 'admin' and not request.user.is_staff:
        # The logged-in user is trying to set role to admin,
        return JsonResponse({'error': 'Permission denied. You cannot assign the Admin role.'}, status=403)

    try:
        employee = get_object_or_404(CustomUser, uuid=employee_uuid)
        data = json.loads(request.body)

        # 更新字段
        employee.username = data.get('username', employee.username)
        employee.email = data.get('email', employee.email)
        new_role = data.get('role', employee.role)
        employee.role = new_role
        employee.gender = data.get('gender', employee.gender)
        employee.department = data.get('department', employee.department)
        employee.phone = data.get('phone', employee.phone)
        employee.country = data.get('country', employee.country)
        birthday = data.get('birthday', None)
        if birthday and birthday != 'N/A':
            try:
                employee.birthday = datetime.strptime(birthday, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid birthday format. Use YYYY-MM-DD.'}, status=400)

        date = data.get('date', None)
        if date and date != 'N/A':
            try:
                employee.date = datetime.strptime(date, '%Y-%m-%d').date()  # ← 转换为真正的日期类型
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid date joined format. Use YYYY-MM-DD.'}, status=400)

        # --- Set is_staff based on the updated role ---
        if new_role and new_role.lower() == 'admin':
            employee.is_staff = True
        else:
            employee.is_staff = False

        # 保存到数据库
        employee.save()

        # 返回更新后的员工数据
        response_data = {
            'success': True,
            'uuid': employee.uuid,
            'username': employee.username,
            'email': employee.email or 'N/A',
            'gender': employee.gender or 'N/A',
            'department': employee.department or 'N/A',
            'phone': employee.phone or 'N/A',
            'role': employee.role or 'N/A',
            'is_staff': employee.is_staff,
            'country': employee.country or 'N/A',
            'date': employee.date.strftime('%Y-%m-%d') if employee.date else 'N/A',
            'birthday': employee.birthday.strftime('%Y-%m-%d') if employee.birthday else 'N/A',

        }
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
