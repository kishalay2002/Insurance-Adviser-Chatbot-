from typing import List, Dict, Optional
import pandas as pd
import fitz
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter


# GraphState for flow control
class GraphState:
    def __init__(self):
        self.requirements: str = ""
        self.recommendations: List[Dict[str, str]] = []
        self.selected_policy: Optional[str] = None
        self.conversation_history: List[Dict[str, str]] = []

    def update_requirements(self, new_req: str) -> None:
        self.requirements = new_req

    def set_recommendations(self, recs: List[Dict[str, str]]) -> None:
        self.recommendations = recs
        self.selected_policy = None

    def select_policy(self, policy_name: str) -> None:
        self.selected_policy = policy_name

    def add_to_history(self, user_text: str, bot_text: str) -> None:
        self.conversation_history.append({"user": user_text, "bot": bot_text})


class Chatbot:
    # Load CSV metadata with preprocessing
    def load_and_process_metadata(self,csv_path):
        df = pd.read_csv(csv_path)
        def preprocess(row):
            row = row.copy()
            row["policy_types"] = [pt.strip() for pt in row["policy_types"].split(";")]
            return row
        return df.apply(preprocess, axis=1)

    # Extract text from PDF
    def extract_text_from_pdf(self,pdf_path):
        doc = fitz.open(pdf_path)
        return "".join([page.get_text() for page in doc])

    # Chunk text with metadata
    def chunk_with_metadata(self,text, meta_row, chunk_size=500, overlap=100):
        splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=overlap)
        chunks = splitter.split_text(text)
        return [{"text": chunk, "metadata": meta_row.to_dict()} for chunk in chunks]

    # Embed chunks
    def embed_chunks(self,chunks):
        model = SentenceTransformer("all-MiniLM-L6-v2")
        texts = [doc["text"] for doc in chunks]
        embeddings = model.encode(texts, convert_to_numpy=True)
        return model, embeddings, texts, [doc["metadata"] for doc in chunks]

    # Build FAISS index
    def build_faiss_index(self,embeddings):
        dim = embeddings.shape[1]
        index = faiss.IndexFlatL2(dim)
        index.add(embeddings)
        return index

    # Infer policy filters from query
    def infer_policy_tags(self,query):
        utility_tags = ["savings", "protection", "retirement", "wealth", "child", "money back"]
        policy_type_tags = [
            "health", "motor", "home", "fire", "travel", "term", 
            "whole", "endowment", "unit-linked", "pension", "child"
        ]
        query = query.lower()
        inferred_utility = next((u for u in utility_tags if u in query), None)
        inferred_policy_types = [pt for pt in policy_type_tags if pt in query]
        return inferred_utility, inferred_policy_types

    # Filtered search
    def search_similar(self,query, model, index, texts, metadata, top_k=5):
        query_vec = model.encode([query])[0].reshape(1, -1)
        D, I = index.search(query_vec, top_k * 2)
        utility, types = self.infer_policy_tags(query)

        results = []
        for idx in I[0]:
            meta = metadata[idx]
            if (utility is None or utility in meta["utility_type"].lower()) and \
            (not types or any(t in pt.lower() for pt in meta["policy_types"] for t in types)):
                results.append({"text": texts[idx], "metadata": meta})
                if len(results) == top_k:
                    break
        return results

    # Use OpenAI to answer query
    def answer_query(self,query, context_chunks, openai_api_key):
        context = "\n\n".join([c["text"] for c in context_chunks])
        prompt = f"Answer the question based on these insurance documents:\n{context}\n\nQuestion: {query}"

        openai.api_key = openai_api_key
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=900,
            top_p=1,
            frequency_penalty=-0.0,
            presence_penalty=0.0
        )
        return response.choices[0].message.content.strip()


    def merge_summaries_by_name(self,data):
        merged = {}

        for item in data:
            name = item["name"]
            summary = item["summary"]
            if name in merged:
                merged[name]["summary"] += " " + summary
            else:
                merged[name] = {"name": name, "summary": summary}

        # Convert back to list of dictionaries
        return list(merged.values())

    # Policy summarizer
    def summarize_policies(self,context_chunks, openai_api_key):
        summaries = []
        for chunk in context_chunks:
            prompt = f"Summarize this insurance policy in less that 70 words:\n{chunk['text']}"
            openai.api_key = openai_api_key
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=60,
                top_p=1,
                frequency_penalty=-0.0,
                presence_penalty=0.0
            )
            summaries.append({
                "name": chunk['metadata'].get("product_name", "Unnamed Policy"),
                "summary": response.choices[0].message.content.strip()
            })

        
        return self.merge_summaries_by_name(summaries)
