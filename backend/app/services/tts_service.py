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
    Converts pure Telugu and English advisory texts into high-clarity MP3 speech audio files.
    Caches audio by content hash for instantaneous retrieval.
    """

    @classmethod
    def generate_audio(cls, scan_id: str, text: str, lang: str = "te") -> str:
        """
        Generates audio file for advisory text in the requested language ('te' or 'en')
        and returns the relative URL path (/api/audio/file/filename).
        """
        if not text:
            text = "రైతు మిత్ర ఏఐ పంట సలహా సేవలు" if lang == "te" else "Rythu Mitra AI crop advisory service"

        # Generate deterministic cache filename based on language and text content
        text_hash = hashlib.md5(f"{lang}_{text}".encode('utf-8')).hexdigest()[:16]
        filename = f"advisory_{lang}_{text_hash}.mp3"
        filepath = os.path.join(settings.AUDIO_DIR, filename)

        if not os.path.exists(filepath) or os.path.getsize(filepath) < 500:
            if HAS_GTTS and gTTS is not None:
                try:
                    target_lang = 'te' if lang == 'te' else 'en'
                    tts = gTTS(text=text[:600], lang=target_lang, slow=False)
                    tts.save(filepath)
                except Exception as e:
                    print(f"gTTS Generation Warning ({lang}): {e}. Falling back to clean audio frame.")
                    cls._create_dummy_mp3(filepath)
            else:
                cls._create_dummy_mp3(filepath)

        return f"/api/audio/file/{filename}"

    @classmethod
    def generate_telugu_audio(cls, scan_id: str, text: str) -> str:
        """Generates audio for Telugu advisory."""
        return cls.generate_audio(scan_id, text, lang="te")

    @classmethod
    def generate_english_audio(cls, scan_id: str, text: str) -> str:
        """Generates audio for English advisory."""
        return cls.generate_audio(scan_id, text, lang="en")

    @classmethod
    def _create_dummy_mp3(cls, filepath: str):
        # Writes minimal valid silent MP3 frame header if offline
        silent_mp3_bytes = b'\xff\xf3\x44\xc4\x00\x00\x00\x03\x48\x00\x00\x00\x00' * 50
        with open(filepath, "wb") as f:
            f.write(silent_mp3_bytes)
