function hamburgermenu() { // hamburger menu script
    document.getElementById('menuformobile').classList.toggle('hidden');
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({top: targetPosition, behavior: 'smooth'});
            const mobilemenu = document.getElementById('menuformobile');
            if (!mobilemenu.classList.contains('hidden')) {
                mobilemenu.classList.add('hidden');
            }
        }
    });
});
// shadow effect for navbar
const navbar = document.querySelector('.navbar-glass');
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(20, 184, 166, 0.1)'; // when you scroll the website until 100 pixels, the shadow will be under the navbar
    } else {
        navbar.style.boxShadow = 'none'; // when you scroll the website, the shadow dissappears
    }
});