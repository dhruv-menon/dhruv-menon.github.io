function renderNav(html_fname) {
    fetch(html_fname)
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar').innerHTML = data;
            addEventListeners();
        });
}

function addEventListeners() {
    var hamburgerMenu = document.getElementById('hamburger-menu');
    var dropdown = document.getElementById('dropdown');

    hamburgerMenu.addEventListener('click', function(event) {
        event.stopPropagation();
        if (dropdown.classList.contains('dropdown-show')) {
            dropdown.classList.remove('dropdown-show');
        } else {
            dropdown.classList.add('dropdown-show');
        }
    });

    dropdown.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    document.body.addEventListener('click', function() {
        if (dropdown.classList.contains('dropdown-show')) {
            dropdown.classList.remove('dropdown-show');
        }
    });
}
