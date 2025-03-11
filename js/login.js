function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(atob(base64));
        console.log(decodedPayload);
        return decodedPayload;
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
}

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    let passwordElement = document.getElementById("username");
    const username = passwordElement.value;
    const password = document.getElementById("password").value;

    const requestData = {
        username: username,
        password: password
    };

    try {
        const response = await fetch("https://risefy-music.ru/auth/sign-in", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            passwordElement.style.backgroundColor = 'red';
            return;
        }

        const responseData = await response.json();

        if (responseData.token) {
            localStorage.setItem("jwtToken", responseData.token);
            const userInfo = parseJwt(responseData.token);
            let role = userInfo.role;
            if (userInfo && role) {
                console.log("User Roles:", role);
                if (role.includes("ROLE_ADMIN")) {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "login.html";
                }
            } else {
                window.location.href = "login.html";
            }
        }

    } catch (error) {
        console.error("Ошибка входа:", error);
        window.location.href = "login.html";
    }
});
