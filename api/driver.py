from flask import Flask, request, jsonify
from chatbot import GraphState, Chatbot
import os

app = Flask(__name__)
bot = Chatbot()

# Initialize the chatbot
metadata_df = bot.load_and_process_metadata("metadata.csv")
chunked_docs = []

for _, row in metadata_df.iterrows():
    print(f"Processing {row['file_path']}")
    text = bot.extract_text_from_pdf(row["file_path"])
    chunked_docs.extend(bot.chunk_with_metadata(text, row))

model, embeddings, texts, metadatas = bot.embed_chunks(chunked_docs)
index = bot.build_faiss_index(embeddings)

# Use environment variable for API key
openai_api_key = os.environ.get("OPENAI_API_KEY", "your-api-key")
state = GraphState()

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    
    state.add_to_history(user_input, "")

    # Branch 1: If asking for a specific policy
    if state.recommendations and any(p["name"].lower() in user_input.lower() for p in state.recommendations):
        for p in state.recommendations:
            if p["name"].lower() in user_input.lower():
                state.select_policy(p["name"])
                query = user_input
                context = bot.search_similar(query, model, index, texts, metadatas)
                answer = bot.answer_query(query, context, openai_api_key)
                state.add_to_history(user_input, answer)
                return jsonify({
                    "response": answer,
                    "selected_policy": p["name"]
                })
    else:
        # Branch 2: Interpret new or refined requirements
        state.update_requirements(user_input)
        context = bot.search_similar(user_input, model, index, texts, metadatas)
        summaries = bot.summarize_policies(context, openai_api_key)
        state.set_recommendations(summaries)
        
        return jsonify({
            "response": "Based on your requirements, I've found some policies that might interest you.",
            "recommendations": summaries
        })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
