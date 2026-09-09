from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class DiseaseClassifier(ABC):
    """
    Abstract Base Class for RythuMitra AI Crop Disease Classifiers.
    
    This interface guarantees that whether a mock model or a real trained ML model
    (e.g., PyTorch, TensorFlow, ONNX) is used, the system interface remains uniform.
    """

    @abstractmethod
    def predict(self, image_bytes: bytes, selected_crop: str) -> Dict[str, Any]:
        """
        Takes raw image bytes and the crop context.
        Returns a dictionary with keys:
        - crop (str)
        - disease (str)
        - disease_telugu (str)
        - confidence (float: 0.0 to 1.0)
        - risk_level (str: High / Medium / Low / Unknown)
        - is_low_confidence (bool)
        """
        pass
