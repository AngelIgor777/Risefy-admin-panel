function addMusicField() {
    let musicList = document.getElementById("musicList");

    let ol = musicList.querySelector("ol");
    if (!ol) {
        ol = document.createElement("ol");
        musicList.appendChild(ol);
    }

    let li = document.createElement("li");
    li.classList.add("music-item", "mb-3");
    li.innerHTML = `
                            <label>
                                <input type="text" class="form-control mb-2" name="musicAuthor[]" placeholder="Автор"
                                       required>
                            </label>
                            <label>
                                <input type="text" class="form-control mb-2" name="musicName[]" placeholder="Название"
                                       required>
                            </label>
                            <br>
                            <label> Файл трека
                                <input type="file" class="form-control" name="musicFile[]" accept="audio/*" required>
                            </label>
                            <br>
                            <br>
                            <label> Файл обложки
                                <input type="file" class="form-control" name="musicFile[]" accept="image/*" required>
                            </label>
                            <br>
                            <label>
                                <button type="button" class="btn btn-danger btn-sm mt-2"
                                        onclick="removeMusicField(this)">
                                    Delete
                                </button>
                            </label>

                            <hr>
        `;

    ol.appendChild(li);
}

function removeMusicField(button) {
    let li = button.closest("li");
    li.remove();
}

function addSeveralMusicFields() {
    let inputAlbumSizeNumber = document.getElementById("albumSize");
    let numberOfFields = parseInt(inputAlbumSizeNumber.value); // Get the numeric value
    if (!isNaN(numberOfFields) && numberOfFields > 0) {  // Check if it's a valid number
        for (let i = 0; i < numberOfFields; i++) {
            addMusicField(); // Add music field multiple times
        }
    } else {

    }
}

async function fetchGenres() {
    try {


        const response = await fetch('https://risefy-music.ru/api/v1/music/allMusicGenres', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk9MRV9VU0VSIiwiaWQiOjEsInN1YiI6Imlnb3Jlazc3NyIsImlhdCI6MTc0MTA3MjQ0OSwiZXhwIjoxNDU3NDEwNzI0NDl9.8gjuFf4Z1mzAXSxE09MMNnBpBFEfD_t3Yejrz3F_c-U'  // Replace with your actual API key
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Parse the response as JSON

        const genresList = document.getElementById('genresList');
        genresList.classList.add('loaded'); // Mark the genres list as loaded


        genresList.innerHTML = ''; // Clear the existing genres list

        // Loop through the JSON data and create cards for each genre
        data.forEach(genre => {
            const genreCard = document.createElement('div');
            genreCard.classList.add('col'); // For responsive layout with grid

            genreCard.innerHTML = `
                <div class="card genre-card">
                    <img src="${genre.coverUrl}" alt="${genre.genreName}" class="card-img-top">
                    <div class="card-body genre-card-body">
                        <h5 class="card-title">${genre.genreName}</h5>
                    </div>
                </div>
            `;

            genresList.appendChild(genreCard);
        });
    } catch (error) {
        console.error('Error fetching the genres:', error);
        const genresList = document.getElementById('genresList');
        genresList.innerHTML = `<p class="text-danger">Failed to load genres. Please try again later.</p>`;
    }
}

// Call the async function to fetch genres
fetchGenres();
let colorAfterClickButton = '#82888f';
let allAlbumsButton = document.getElementById('allAlbumsButton');
let addAlbumsButton = document.getElementById('addAlbumsButton');

// Function to toggle visibility of divs based on button clicks
addAlbumsButton.addEventListener('click', function () {
    document.getElementById('uploadForm').style.display = 'block'; // Show upload form
    document.getElementById('allAlbums').style.display = 'none';  // Hide all albums
    addAlbumsButton.style.color = colorAfterClickButton;
    allAlbumsButton.style.color = 'white';

});

allAlbumsButton.addEventListener('click', function () {
    document.getElementById('uploadForm').style.display = 'none';  // Hide upload form
    document.getElementById('allAlbums').style.display = 'block'; // Show all albums
    allAlbumsButton.style.color = colorAfterClickButton;
    addAlbumsButton.style.color = 'white';
});