window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    document.getElementById('progressBar').style.width = scrolled + '%';
});
// scroll progress in index.html