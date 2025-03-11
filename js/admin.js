
function checkAdminAccess() {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
        console.warn("No token found! Redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    const userInfo = parseJwt(token);

    if (!userInfo || !userInfo.role || !userInfo.role.includes("ROLE_ADMIN")) {
        console.warn("Access denied! Redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    console.log("Access granted. Welcome, Admin!");
}

// Run the check when the page loads
document.addEventListener("DOMContentLoaded", checkAdminAccess);




let trackIndex = 1;

function addMusicField() {
    if (trackIndex > 10) {
        alert("Максимум 10 треков!");
        return;
    }

    let musicList = document.getElementById("musicList");
    let div = document.createElement("div");
    div.classList.add("music-item", "mb-3");
    div.innerHTML = `
            <li>
                <label>
                    <input type="text" class="form-control mb-2" name="musicAuthor" placeholder="Автор">
                </label>
                <label>
                    <input type="text" class="form-control mb-2" name="musicName" placeholder="Название" required>
                </label>
                <br>
                <label class="uploadAlbumMainText"> Файл трека
                    <input type="file" class="form-control" name="music${trackIndex}" accept="audio/*" required>
                </label>
                <br>
                <label class="uploadAlbumMainText"> Файл обложки
                    <input type="file" class="form-control" name="cover${trackIndex}" accept="image/*">
                </label>
                <br>
                <button type="button" class="btn btn-danger btn-sm mt-2" onclick="removeMusicField(this)">Удалить</button>
                <hr>
            </li>
        `;

    musicList.appendChild(div);
    trackIndex++;
}

function removeMusicField(button) {
    button.parentElement.remove();
    trackIndex--;
}

document.getElementById("musicUploadForm").addEventListener("submit", submitForm);

async function submitForm(event) {
    event.preventDefault();
    const token = localStorage.getItem("jwtToken"); // Retrieve token from localStorage

    document.getElementById("loading").style.display = "block";


    let formData = new FormData();

    formData.append("albumName", document.getElementById("albumName").value);
    formData.append("albumCoverFile", document.getElementById("albumCover").files[0]);

    let musicRequestDtos = [];

    document.querySelectorAll("#musicList .music-item").forEach((item, index) => {
        let author = item.querySelector("[name='musicAuthor']").value;
        let name = item.querySelector("[name='musicName']").value;
        let trackFile = item.querySelector(`[name='music${index + 1}']`).files[0];
        let coverFile = item.querySelector(`[name='cover${index + 1}']`)?.files[0];
        formData.append(`music${index + 1}`, trackFile);
        formData.append(`cover${index + 1}`, coverFile);
        console.log(author, name, trackFile, coverFile);

        let musicRequestDto = {
            author: author,
            name: name,
            genre: "",
            cover: null,
            music: null
        };

        musicRequestDtos.push(musicRequestDto);
        console.log(author, name, trackFile, coverFile);
    });

    formData.append("musicRequestDtosJson", JSON.stringify(musicRequestDtos));

    console.log(formData);
    try {
        let response = await fetch("https://risefy-music.ru/api/v1/music/allMusicGenres", {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Album saved successfully!");
        } else {
            alert("Error saving album.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        document.getElementById("loading").style.display = "none";
    }
}


function addSeveralMusicFields() {
    let inputAlbumSizeNumber = document.getElementById("albumSize");
    let numberOfFields = parseInt(inputAlbumSizeNumber.value);
    if (!isNaN(numberOfFields) && numberOfFields > 0) {
        for (let i = 0; i < numberOfFields; i++) {
        }
    } else {

    }
}

async function fetchGenres() {
    const token = localStorage.getItem("jwtToken"); // Retrieve token from localStorage

    try {


        const response = await fetch('https://risefy-music.ru/api/v1/music/allMusicGenres', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const genresList = document.getElementById('genresList');
        genresList.classList.add('loaded');


        genresList.innerHTML = '';


        data.forEach(genre => {
            const genreCard = document.createElement('div');
            genreCard.classList.add('col');

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

fetchGenres();
let colorAfterClickButton = '#82888f';
let allAlbumsButton = document.getElementById('allAlbumsButton');
let addAlbumsButton = document.getElementById('addAlbumsButton');

addAlbumsButton.addEventListener('click', function () {
    document.getElementById('uploadForm').style.display = 'block';
    document.getElementById('allAlbums').style.display = 'none';
    addAlbumsButton.style.color = colorAfterClickButton;
    allAlbumsButton.style.color = 'white';

});

allAlbumsButton.addEventListener('click', function () {
    document.getElementById('uploadForm').style.display = 'none';
    document.getElementById('allAlbums').style.display = 'block';
    allAlbumsButton.style.color = colorAfterClickButton;
    addAlbumsButton.style.color = 'white';
});


function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1]; // Get payload
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Fix encoding
        const decodedPayload = JSON.parse(atob(base64)); // Decode base64 to JSON

        return decodedPayload; // Return full payload
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
}

function logout() {
    localStorage.removeItem("jwtToken");
    window.location.href = "login.html";
}