from flask import Flask, request, jsonify
import whisper
from flask_cors import CORS
import numpy as np
from pydub import AudioSegment
import os

app = Flask(__name__)
CORS(app)

model = whisper.load_model("base")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        # Check if an audio file is present in the request
        if "audio" not in request.files:
            return jsonify({"error": "No audio file found in the request"}), 400

        # Get the audio file from the request
        audio_file = request.files["audio"]
        
        # Save the audio file to a temporary location
        audio_file_path = "./temp_audio.wav"
        audio_file.save(audio_file_path)

        # Load the audio file with pydub
        audio = AudioSegment.from_file(audio_file_path)
        
        # Convert to mono and resample to 16 kHz
        audio = audio.set_channels(1).set_frame_rate(16000)
        
        # Export to a new temporary file
        processed_audio_path = "./processed_temp_audio.wav"
        audio.export(processed_audio_path, format="wav")
        
        # Load the processed audio with whisper
        result = model.transcribe(processed_audio_path)
        print(result)
        
        # Clean up the temporary audio files
        os.remove(audio_file_path)
        os.remove(processed_audio_path)

        return jsonify(result)
    
    except Exception as e:
        print("An error occurred during transcription:")
        print(str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)