import joblib

model_path = "models/sentinelx/model.joblib"

model = joblib.load(model_path)

print("Model loaded successfully!")
print("Model type:", type(model))

print("\nModel parameters:")
print(model.get_params())

print("\nNumber of features:", model.n_features_in_)

print("\nFeature names:")
print(model.feature_name_)