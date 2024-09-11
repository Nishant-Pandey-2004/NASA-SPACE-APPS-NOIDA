let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const micContainer = document.getElementById("micContainer");
const micIcon = document.getElementById("micIcon");
const wave = document.getElementById("wave");
const status = document.getElementById("status");
const textBox = document.getElementById("textBox");

micContainer.addEventListener("click", () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    console.log("Recording started.");
    status.textContent = "Recording...";
    isRecording = true;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], "recording.wav", { type: 'audio/wav' });
            sendAudioFile(audioFile);
            status.textContent = "Recording stopped. Processing...";
        };

        mediaRecorder.start();
        micIcon.classList.add("active");
        wave.style.opacity = 1;
    } catch (error) {
        console.error("Error accessing microphone:", error);
        status.textContent = "Error accessing microphone. Please allow microphone access.";
    }
}

function stopRecording() {
    console.log("Recording stopped.");
    mediaRecorder.stop();
    isRecording = false;
    micIcon.classList.remove("active");
    wave.style.opacity = 0;
    status.textContent = "Recording stopped. Click the mic to start recording again.";
}

function sendAudioFile(file) {
    console.log("Sending audio file...");
    const formData = new FormData();
    formData.append("audio", file);

    // Replace with your server URL for transcription
    fetch("http://127.0.0.1:5000/transcribe", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        console.log("Transcription response:", response);
        return response.json();
    })
    .then(data => {
        console.log("Transcription result:", data);
        displayTranscription(data.text);
    })
    .catch(error => {
        console.error("Error during transcription:", error);
        status.textContent = "Error during transcription.";
    });
}

function displayTranscription(text) {
    console.log("Transcription:", text);
    textBox.textContent = text; // Display transcription result in text box
}