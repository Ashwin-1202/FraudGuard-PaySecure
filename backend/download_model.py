from huggingface_hub import snapshot_download

model_path = snapshot_download(
    repo_id="ARUNAGIRINATHAN/SentinelX_v1.0_LGBM",
    local_dir="./models/sentinelx"
)

print("Model downloaded successfully!")
print("Model location:", model_path)