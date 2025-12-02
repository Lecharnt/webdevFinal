function loadComponent(id, filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
            if (id === "navbar") {
                highlightActiveLink();
            }
        })
}

//makes it so it loads the nav and foooter bar on load
window.onload = () => {
    loadComponent("navbar", "/components/navbar.html");
    loadComponent("footer", "/components/footer.html");
};
function highlightActiveLink() {
    const currentPath = window.location.pathname; // "/statistics", "/solar-statistics", etc.
    const links = document.querySelectorAll("#navbar a.nav-link");

    links.forEach(link => {
        const linkPath = link.getAttribute("href");

        if (linkPath === currentPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

