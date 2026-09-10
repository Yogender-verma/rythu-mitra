from .classifier import DiseaseClassifier
from .mock_classifier import MockDiseaseClassifier
from ..config import settings

def get_classifier() -> DiseaseClassifier:
    """
    Factory method to return the active ML classifier instance.
    Uses RealDiseaseClassifier with PyTorch trained weights if available.
    """
    try:
        from .real_classifier import RealDiseaseClassifier
        return RealDiseaseClassifier()
    except Exception as e:
        print(f"[get_classifier WARNING] Falling back to mock due to error: {e}")
        return MockDiseaseClassifier()
