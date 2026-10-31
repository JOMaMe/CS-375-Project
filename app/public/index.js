let messageBox = document.getElementById("message");
let codeInput = document.getElementById("code");

let joinButton = document.getElementById("join");
joinButton.addEventListener("click", () => {
    fetch(`/get-code?code=${encodeURIComponent(codeInput.value)}`).then((response) =>
    response.text().then((body) => {
        if (!response.ok) {
            throw new Error(body);
        }
        return body;
    })).then((code) => {
        messageBox.textContent = `Joining room ${code}`;
    }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        messageBox.textContent = message;
        console.error(error);
    });
});

let hostButton = document.getElementById("host");
hostButton.addEventListener("click", () => {
    fetch(`/get-new-code`).then((response) => 
        response.text().then((body) => {
        if (!response.ok) {
            throw new Error(body);
        }
        return body;
    })).then((code) => {
        messageBox.textContent = `Hosting room ${code}`;
    }).catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        messageBox.textContent = message;
        console.error(error);
    });
});