// navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar-nav');


    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });


    const links = document.querySelectorAll('.nav-item');
    links.forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    });
});