from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from chatbot import GraphState, Chatbot
import json

# Initialize the chatbot
bot = Chatbot()
state = GraphState()

# Initialize the chatbot components
print("Loading metadata...")
metadata_df = bot.load_and_process_metadata("metadata.csv")
chunked_docs = []

for _, row in metadata_df.iterrows():
    print(f"Processing {row['file_path']}")
    text = bot.extract_text_from_pdf(row["file_path"])
    chunked_docs.extend(bot.chunk_with_metadata(text, row))

print("Embedding chunks...")
model, embeddings, texts, metadatas = bot.embed_chunks(chunked_docs)
index = bot.build_faiss_index(embeddings)

# OpenAI API key
openai_api_key = "<OPENAI-API-KEY>"

app = Flask(__name__)
CORS(app) 

# Contact intent detection helper
def is_contact_request(user_input: str) -> bool:
    contact_keywords = [
        "contact", "email", "phone", "number", "support", "customer service", 
        "reach you", "get in touch", "call", "help line", "address","human","agent"
    ]
    user_input = user_input.lower()
    return any(keyword in user_input for keyword in contact_keywords)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')

    state.add_to_history(user_input, "")

    #Contact Info Request
    if is_contact_request(user_input):
        contact_info = (
            "You can reach us via:\n"
            "📞 Phone: +1800 267 9090\n"
            "📧 Email: info@sbilife.co.in\n"
            "🏢 Corporate Office: Natraj, M V Road & Western Express Highway Junction, Andheri (East), Mumbai - 400 069"
        )
        state.conversation_history[-1]["bot"] = contact_info
        return jsonify({
            "type": "answer",
            "response": contact_info,
            "selected_policy": state.selected_policy
        })

    #If asking for a specific policy
    if state.recommendations and any(p["name"].lower() in user_input.lower() for p in state.recommendations):
        for p in state.recommendations:
            if p["name"].lower() in user_input.lower():
                state.select_policy(p["name"])
                query = user_input
                context = bot.search_similar(query, model, index, texts, metadatas)
                answer = bot.answer_query(query, context, openai_api_key)
                state.conversation_history[-1]["bot"] = answer
                return jsonify({
                    "type": "answer",
                    "response": answer,
                    "selected_policy": p["name"]
                })
    else:
        #Interpret new or refined requirements
        state.update_requirements(user_input)
        context = bot.search_similar(user_input, model, index, texts, metadatas)
        summaries = bot.summarize_policies(context, openai_api_key)
        state.set_recommendations(summaries)
        state.conversation_history[-1]["bot"] = "Based on your requirements, I've found some policies that might interest you."

        return jsonify({
            "type": "recommendations",
            "response": "Based on your requirements, I've found some policies that might interest you.",
            "recommendations": summaries
        })

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify({
        "history": state.conversation_history,
        "recommendations": state.recommendations,
        "selected_policy": state.selected_policy
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
