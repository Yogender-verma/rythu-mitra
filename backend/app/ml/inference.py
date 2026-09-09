from .classifier import DiseaseClassifier
from .mock_classifier import MockDiseaseClassifier
from ..config import settings

def get_classifier() -> DiseaseClassifier:
    """
    Factory method to return the active ML classifier instance based on configuration.
    Currently defaults to MockDiseaseClassifier.
    When a real ML model is trained, instantiate RealDiseaseClassifier here.
    """
    if settings.ML_MODEL_PROVIDER == "mock":
        return MockDiseaseClassifier()
    else:
        # Fallback to mock if real provider not available
        return MockDiseaseClassifier()
