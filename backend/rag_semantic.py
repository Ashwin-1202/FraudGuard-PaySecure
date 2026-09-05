import json
import numpy as np

from sentence_transformers import SentenceTransformer


# ==========================================
# LOAD EMBEDDING MODEL
# ==========================================

print("Loading embedding model...")

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

print("Embedding model loaded!")


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
# CREATE KNOWLEDGE EMBEDDINGS
# ==========================================

knowledge_texts = [
    item["content"]
    for item in knowledge_base
]

knowledge_embeddings = embedding_model.encode(
    knowledge_texts,
    normalize_embeddings=True
)


# ==========================================
# COSINE SIMILARITY
# ==========================================

def cosine_similarity(
    query_embedding,
    document_embeddings
):

    return np.dot(
        document_embeddings,
        query_embedding
    )


# ==========================================
# SEMANTIC RETRIEVAL
# ==========================================

def retrieve_semantic_knowledge(
    query,
    top_k=3
):

    # Convert query into embedding

    query_embedding = embedding_model.encode(
        query,
        normalize_embeddings=True
    )


    # Calculate similarity

    similarities = cosine_similarity(
        query_embedding,
        knowledge_embeddings
    )


    # Get highest similarity indexes

    top_indexes = np.argsort(
        similarities
    )[::-1][:top_k]


    results = []


    for index in top_indexes:

        item = knowledge_base[index]

        results.append({

            "feature":
                item["feature"],

            "title":
                item["title"],

            "content":
                item["content"],

            "similarity":
                round(
                    float(
                        similarities[index]
                    ),
                    4
                )
        })


    return results