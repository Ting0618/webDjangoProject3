document.addEventListener('DOMContentLoaded', function() {
    // Dynamic menu control
    const navItems = document.querySelectorAll('.nav-item.has-submenu');
    // traverse all nav items
    navItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const submenu = this.querySelector('.submenu');
            submenu.style.transition = 'all 0.3s ease-out';
            submenu.style.opacity = '1';
            submenu.style.visibility = 'visible';
            submenu.style.transform = 'translateY(0)';
        });

        item.addEventListener('mouseleave', function() {
            const submenu = this.querySelector('.submenu');
            submenu.style.transition = 'all 0.2s ease-in';
            submenu.style.opacity = '0';
            submenu.style.visibility = 'hidden';
            submenu.style.transform = 'translateY(-15px)';
        });
    });

    // table interaction
    document.querySelectorAll('.table-row').forEach(row => {
        row.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    // Mobile menu adaptation
    function checkMobile() {
        if (window.innerWidth <= 768) {
            document.querySelector('.nav-menu').classList.add('mobile-mode');
        } else {
            document.querySelector('.nav-menu').classList.remove('mobile-mode');
        }
    }
    window.addEventListener('resize', checkMobile);
    checkMobile();
});