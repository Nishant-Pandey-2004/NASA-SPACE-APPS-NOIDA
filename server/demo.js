function sendAudioFile(file) {
    const formData = new FormData();
    formData.append("audio", file);

    fetch("http://127.0.0.1:5000/transcribe", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const transcriptionTextElement = document.getElementById("transcriptionText");
        console.log(data)
        transcriptionTextElement.textContent = data.text;
    })
    .catch(error => {
        console.error("Error during transcription:", error);
    });
}


document.getElementById("audioInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        sendAudioFile(file);
    }
});
