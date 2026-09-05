---
license: apache-2.0
language:
- en
tags:
- Tabular-classification
- fraud-detection
- deep-tabular-learning
pipeline_tag: tabular-classification
---
# SentinelX v1.0 — LightGBM Fraud Detector

A LightGBM-based binary classifier for tabular transaction fraud detection. Trained via `run_pipeline.py`, with features engineered in `features/build_features.py`. Outputs per-transaction fraud probability.

## Usage
```python
from huggingface_hub import hf_hub_download
import joblib
import pandas as pd

repo_id = "ARUNAGIRINATHAN/SentinelX_v1.0_LGBM"

model_path = hf_hub_download(repo_id=repo_id, filename="model.joblib")
model = joblib.load(model_path)

feat_path = hf_hub_download(repo_id=repo_id, filename="features.txt")
with open(feat_path, "r") as f:
    features = [line.strip() for line in f]
```

## Intended Use
- Use for ranking or thresholded classification of potentially fraudulent transactions.
- Not production-ready without calibration, fairness checks, drift monitoring, and human-in-the-loop review.

## Model Details
- Algorithm: LightGBM (binary objective)
- Input: Tabular features saved in `features.txt`
- Output: Probability of fraud (`predict_proba[:, 1]`)
- Artifacts: `model.joblib`, `lightgbm_model.txt`, `features.txt`, `shap_summary.png`, `submission.csv`

## Data & Training
- Training data: `Dataset/train_transaction.csv` (local file, not included on the Hub)
- Process: `ingestion/load_data.py` → `features/build_features.py` → `models/train_lgbm.py` → `models/evaluate.py`
- Run: `python run_pipeline.py` (artifacts saved under `artifacts/`)

## Evaluation
- Metrics (validation): ROC AUC, Precision, Recall, F1.
- Update with your results:
  - ROC AUC: TBD
  - Precision/Recall/F1: TBD


## Limitations
- Performance depends on data quality and drift; retrain periodically.
- Threshold selection requires business calibration and cost analysis.