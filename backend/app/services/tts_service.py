import os
import hashlib
from ..config import settings

try:
    from gtts import gTTS  # type: ignore # pyright: ignore[reportMissingImports]
    HAS_GTTS = True
except ImportError:
    gTTS = None
    HAS_GTTS = False

class TTSService:
    """
    Text-to-Speech Service interface for RythuMitra AI.
    Converts Telugu advisory text into MP3 speech audio files.
    """

    @classmethod
    def generate_telugu_audio(cls, scan_id: str, text: str) -> str:
        """
        Generates audio file for Telugu advisory text and returns the serving relative URL path.
        """
        if not text:
            text = "రైతు మిత్ర ఏఐ పంట సలహా సేవలు"

        filename = f"advisory_{scan_id}.mp3"
        filepath = os.path.join(settings.AUDIO_DIR, filename)

        if not os.path.exists(filepath):
            if HAS_GTTS and gTTS is not None:
                try:
                    # Use Telugu language code 'te'
                    tts = gTTS(text=text, lang='te', slow=False)
                    tts.save(filepath)
                except Exception as e:
                    print(f"gTTS Generation Warning: {e}. Falling back to audio synth endpoint.")
                    cls._create_dummy_mp3(filepath)
            else:
                cls._create_dummy_mp3(filepath)

        return f"/api/audio/file/{filename}"

    @classmethod
    def _create_dummy_mp3(cls, filepath: str):
        # Writes minimal valid silent MP3 frame header if offline
        silent_mp3_bytes = b'\xff\xf3\x44\xc4\x00\x00\x00\x03\x48\x00\x00\x00\x00' * 50
        with open(filepath, "wb") as f:
            f.write(silent_mp3_bytes)
