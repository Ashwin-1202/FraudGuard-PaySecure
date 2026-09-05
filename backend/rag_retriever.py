import json


# ==========================================
# LOAD KNOWLEDGE BASE
# ==========================================

KNOWLEDGE_PATH = "data/fraud_knowledge.json"


with open(
    KNOWLEDGE_PATH,
    "r",
    encoding="utf-8"
) as file:

    knowledge_base = json.load(file)


# ==========================================
# RETRIEVE KNOWLEDGE
# ==========================================

def retrieve_knowledge(
    features,
    top_k=3
):

    retrieved = []

    for item in knowledge_base:

        if item["feature"] in features:

            retrieved.append(item)

    return retrieved[:top_k]