import CONFIG from './prod-config.js';

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
}


// Run the check when the page loads
document.addEventListener("DOMContentLoaded", checkAdminAccess);


let trackIndex = 1;

window.addMusicField = function () {
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

window.removeMusicField = function (button) {
    button.parentElement.remove();
    trackIndex--;
}

// handle create new album with tracks
document.getElementById("musicUploadForm").addEventListener("submit", createAlbum);

async function createAlbum(event) {
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
        let response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/music/allMusicGenres`, {
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
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/music/allMusicGenres`, {
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

        if (data.length === 0) {
            genresList.innerHTML = `<p class="text-warning">No genres available.</p>`;
            return;
        }

        data.forEach(genre => {
            const genreCard = document.createElement('div');
            genreCard.classList.add('col');

            genreCard.innerHTML = `
                 <div class="card genre-card">
                    <img src="${genre.coverUrl || 'https://risefy.org/IMG_20240904_181211.png'}" alt="${genre.genreName}" class="card-img-top genre-image-card">
                    <div class="card-body genre-card-body">
                        <h5 class="card-title">${genre.genreName}</h5>
                    </div>
                    <div class="button-container">
                        <button class="change-cover-btn">Изменить</button>
                        <button class="change-cover-btn">Добавить треки</button>
                        <button class="change-cover-btn deleteButton">Удалить</button>
                    </div>
                </div>
            `;
            genreCard.querySelector('.genre-image-card').addEventListener('click', () => openGenreModal(genre.allMusicGenresUrl));

            genreCard.querySelector('.change-cover-btn:nth-child(2)').addEventListener('click', () => openAddTracksModal(genre.id));

            genreCard.querySelector('.change-cover-btn').addEventListener('click', () => openGenresChangeModal(genre));

            const deleteBtn = genreCard.querySelector('.deleteButton');
            deleteBtn.addEventListener('click', (event) => {
                console.log(`Delete clicked for: ${genre.genreName}`); // Debugging
                confirmDeleteGenre(genre, genreCard);
            });

            genresList.appendChild(genreCard);
        });
    } catch (error) {
        console.error('Error fetching the genres:', error);
        document.getElementById('genresList').innerHTML = `<p class="text-danger">Failed to load genres. Please try again later.</p>`;
    }
}

fetchGenres();
let currentGenre = '';
let currentPage = 0;

async function fetchTracks(genre, page = 0) {
    if (genre === currentGenre && page === currentPage) return;
    currentGenre = genre;
    currentPage = page;

    const token = localStorage.getItem("jwtToken");

    try {
        let url = `${CONFIG.API_BASE_URL}/api/v1/music/genre/${genre}?page=${page}&size=6`;
        console.debug("fetch tracks to: " + url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const tracks = await response.json();
        console.debug("fetch tracks by genre : '" + genre + "' " + tracks);
        const trackList = document.getElementById('trackList');
        trackList.innerHTML = '';

        if (tracks.length === 0) {
            trackList.innerHTML = `<p class="message warning">No tracks found.</p>`;
            updatePagination(genre, page, false);
            return;
        }

        tracks.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.classList.add('track-item');

            trackItem.innerHTML = `
            <img src="${track.coverMediumURL || 'https://risefy.org/IMG_20240904_181211.png'}" alt="Cover" class="track-cover">
            <div class="track-info">
                <h5 class="trackTitle">${track.title}</h5>
                <p>${track.artistName}</p>
            </div>
            <div class="track-actions">
                <audio controls class="audio-player">
                    <source src="${track.musicUrl}" type="audio/mpeg">
                </audio>
                <button class="delete-track-btn" data-music-id="${track.soundid}">🗑
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

            // Attach delete event listener
            trackItem.querySelector('.delete-track-btn').addEventListener('click', () => confirmDeleteTrack(track.soundid, trackItem));

            trackList.appendChild(trackItem);
        });
        setupAudioControls();
        updatePagination(genre, page, tracks.length >= 6);
    } catch (error) {
        console.error('Error fetching tracks:', error);
        document.getElementById('trackList').innerHTML = `<p class="message error">Failed to load tracks. Please try again later.</p>`;
    }
}

function setupAudioControls() {
    const audioPlayers = document.querySelectorAll('.audio-player');

    audioPlayers.forEach(audio => {
        audio.addEventListener('play', () => {
            audioPlayers.forEach(otherAudio => {
                if (otherAudio !== audio) {
                    otherAudio.pause();
                    otherAudio.currentTime = 0; // Reset the playback time
                }
            });
        });

    });
}


function updatePagination(genre, page, hasNext) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = `
        <button class="btn navigationButtonTracks" id="prevButton" ${page === 0 ? 'disabled' : ''}>⬅️</button>
        <span class="page-info">${page + 1}</span>
        <button class="btn navigationButtonTracks" id="nextButton" ${!hasNext ? 'disabled' : ''}>➡️</button>
    `;

    // Now, add event listeners to the buttons
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    // Add click event listeners
    if (prevButton) {
        prevButton.addEventListener('click', () => fetchTracks(genre, page - 1));
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => fetchTracks(genre, page + 1));
    }
}


function openGenreModal(genre) {
    if (document.getElementById('modal').style.display === 'block' && currentGenre === genre) return; // Prevent reloading the same genre
    document.getElementById('modal').style.display = 'block';
    fetchTracks(genre);
}


let closeModalTracksButton = document.getElementById('closeModalTracks');

closeModalTracksButton.addEventListener('click', function () {
    closeModal()
});


function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

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

window.logout = function() {
    localStorage.removeItem("jwtToken");
    window.location.href = "login.html";
}


function openGenresChangeModal(genre) {
    const modal = document.getElementById('genreModal');
    document.getElementById('albumId').value = genre.id; // Set albumId
    document.getElementById('albumName').value = genre.genreName; // Set album name
    modal.style.display = 'block'; // Open the modal
}

document.getElementById('closeGenreModalChange').addEventListener('click', closeGenresChangeModal);

function closeGenresChangeModal() {
    const modal = document.getElementById('genreModal'); // Make sure to select the modal itself
    modal.style.display = 'none'; // Close the modal
}

document.getElementById('coverForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("jwtToken");
    console.debug('token', token);
    const albumId = document.getElementById('albumId').value;
    const albumName = document.getElementById('modalAlbumName').value;
    const albumCoverFile = document.getElementById('albumCoverFile').files[0];

    const formData = new FormData();
    formData.append('albumId', albumId);
    formData.append('albumName', albumName);
    formData.append('albumCoverFile', albumCoverFile);

    console.debug(formData)
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/music/allMusicGenres/set`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
        if (response.ok) {
            alert('Cover updated successfully!');
            closeGenresChangeModal(); // Close modal after update
            fetchGenres(); // Re-fetch genres to reflect the changes
        } else {
            alert('Failed to update cover. Please try again.');
        }
    } catch (error) {
        console.error('Error updating cover:', error);
        alert('Failed to update cover. Please try again.');
    }
});


//


// Opens modal when "Добавить треки" is clicked
function openAddTracksModal(albumId) {
    document.getElementById("albumIdInput").value = albumId; // Set album ID
    document.getElementById("addTracksModal").style.display = "block";
}


// Closes modal
function closeAddTracksModal() {
    document.getElementById("addTracksModal").style.display = "none";
}

let closeAddTracksModalButton = document.getElementById("closeModal");
closeAddTracksModalButton.addEventListener('click', closeAddTracksModal);


// Adds a new track input field
let existingTrackIndex = 1;

function addMusicFieldToExisting() {
    if (existingTrackIndex > 10) {
        alert("Максимум 10 треков!");
        return;
    }

    let musicList = document.getElementById("musicListExisting");
    let div = document.createElement("div");
    div.classList.add("music-item", "mb-3");
    div.innerHTML = `
        <li>
            <input type="text" class="form-control mb-2" name="musicAuthor" placeholder="Автор">
            <input type="text" class="form-control mb-2" name="musicName" placeholder="Название" required>
            <br>
            <label class="uploadAlbumMainText">Файл трека
                <input type="file" class="form-control" name="music${existingTrackIndex}" accept="audio/*" required>
            </label>
            <br>
            <label class="uploadAlbumMainText"> Файл обложки
                <input type="file" class="form-control" name="cover${existingTrackIndex}" accept="image/*">
            </label>
            <br>
            <button type="button" class="btn btn-danger btn-sm mt-2" onclick="removeMusicFieldExisting(this)">Удалить</button>
            <hr>
        </li>
    `;

    musicList.appendChild(div);
    existingTrackIndex++;
}

let addTracksFormButton = document.getElementById("addTracksFormButton");
addTracksFormButton.addEventListener('click', addMusicFieldToExisting);

// Removes a track field
window.removeMusicFieldExisting = function (button) {
    button.parentElement.remove();
    existingTrackIndex--;
}

// Handles add music to album submission
document.getElementById("addTracksForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const token = localStorage.getItem("jwtToken"); // Retrieve token

    document.getElementById("loadingExisting").style.display = "block";

    let formData = new FormData();
    formData.append("albumId", document.getElementById("albumIdInput").value);

    let musicRequestJson = [];

    document.querySelectorAll("#musicListExisting .music-item").forEach((item, index) => {
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
            genre: null,
            cover: null,
            music: null
        };

        musicRequestJson.push(musicRequestDto);
    });

    formData.append("musicRequestDtosJson", JSON.stringify(musicRequestJson));

    try {
        let response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/music/allMusicGenres/add`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Треки успешно добавлены в альбом!");
            closeAddTracksModal();
        } else {
            alert("Ошибка при добавлении треков.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        document.getElementById("loadingExisting").style.display = "none";
    }
});

function confirmDeleteGenre(genre, genreCard) {
    Swal.fire({
        title: "Вы уверены?",
        text: `Удалить жанр "${genre.genreName}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Удалить",
        cancelButtonText: "Отмена",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d"
    }).then(async (result) => {
        if (result.isConfirmed) {
            console.log(`Confirmed delete for: ${genre.genreName}`);
            await deleteGenre(genre.id, genreCard);
            Swal.fire("Удалено!", "Жанр успешно удален.", "success");
        }
    });
}


// Function to send DELETE request
async function deleteGenre(genreId, genreCard) {
    const token = localStorage.getItem("jwtToken");

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/music/allMusicGenres?albumId=${genreId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Remove the genre from the UI
        genreCard.remove();
    } catch (error) {
        console.error('Error deleting the genre:', error);
        alert('Failed to delete genre. Please try again later.');
    }
}


async function confirmDeleteTrack(musicId, trackItem) {
    Swal.fire({
        title: "Вы уверены?",
        text: "Удалить этот трек?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Удалить",
        cancelButtonText: "Отмена",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d"
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteTrack(musicId, trackItem);
            Swal.fire("Удалено!", "Трек успешно удален.", "success");
        }
    });
}

async function deleteTrack(musicId, trackItem) {
    const token = localStorage.getItem("jwtToken");

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/music?musicId=${musicId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`Failed to delete track: ${response.status}`);

        console.log(`Track ${musicId} deleted successfully.`);
        trackItem.remove(); // Remove track from the DOM after deletion
    } catch (error) {
        console.error('Error deleting track:', error);
        Swal.fire("Ошибка!", "Не удалось удалить трек.", "error");
    }
}
