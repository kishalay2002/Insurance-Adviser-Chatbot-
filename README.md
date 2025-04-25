
# AI-Powered Insurance Advisor Chatbot

This project is an **AI-based Insurance Advisor chatbot** built to assist users in understanding and selecting suitable insurance policies. It uses NLP, semantic search, and language generation to convert static insurance PDFs into an intelligent, interactive experience.

This project was developed as part of the **TCS BFSI Garaje Hackathon** for selection into the Banking, Financial Services & Insurance vertical at Tata Consultancy Services.

**Project Report**: https://drive.google.com/file/d/1r_b0_6OJh7Dhf7ckC0QJcrst06Z4uaa_/view?usp=sharing

**Project Demo with Explanation**: https://drive.google.com/file/d/1E3_jFj1vdioakk4QNIR220S4n6uSE3Ze/view?usp=sharing

---

## Features

- ✅ Parses and processes real insurance documents (PDFs).
- ✅ Uses semantic embeddings to understand the context of user queries.
- ✅ Filters recommendations using inferred tags like utility and policy types.
- ✅ Retrieves and ranks relevant policy content using FAISS.
- ✅ Answers questions and summarizes policy content using GPT-4o.
- ✅ Includes a frontend in **TypeScript** for smooth user interaction.

---

## Machine Learning Stack

| Component        | Technology Used                    |
|------------------|------------------------------------|
| Text Embedding   | `all-MiniLM-L6-v2` (SentenceTransformer) |
| Text Chunking    | LangChain `RecursiveCharacterTextSplitter` |
| Vector Store     | FAISS (Facebook AI Similarity Search) |
| Language Model   | OpenAI GPT-4o                      |
| PDF Extraction   | PyMuPDF (`fitz`)                   |

---

## Methodology

1. **Data Collection**
   - Insurance policy PDFs downloaded from the SBI General Insurance website.
   - A `metadata.csv` file manually created to store utility, policy types, and document path.

2. **Text Processing**
   - Text is extracted from each PDF using PyMuPDF.
   - Long text is split into overlapping chunks (~500 chars with 100-char overlap).
   - Each chunk is paired with metadata for traceability and filtering.

3. **Embedding & Indexing**
   - Chunks are converted into embeddings using `all-MiniLM-L6-v2`.
   - Embeddings are stored in a FAISS index for fast semantic search.

4. **User Query Handling**
   - Queries are embedded and matched against document chunks.
   - Query intent is inferred via rule-based tagging (utility + policy type).
   - Top results are filtered and retrieved based on relevance.

5. **GPT-based Generation**
   - GPT-4o is used to:
     - Summarize policy chunks into ~70-word previews.
     - Answer user questions with context-specific responses.

6. **Stateful Conversation**
   - A `GraphState` class manages the conversation:
     - Stores user requirements
     - Tracks selected policies
     - Logs chat history for multi-turn interactions

---


## Installation & Setup

```bash
git clone https://github.com/kishalay2002/Insurance-Adviser-Chatbot-.git
```

### Backend (Python 3.9+)
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python driver.py
```

> Make sure you have your OpenAI API key available and configured in `driver.py`.

---

### Frontend

```bash
# Install all dependencies
npm install

#Run the frontend server
npm run dev
```

## API Key Configuration

Replace the OpenAI key in `driver.py`:
```python
openai_api_key = "sk-..."  # Replace with your own key
```

For production use, environment variables are recommended.

---

## Example Query Flow

1. User: "I’m looking for a health insurance plan for my parents."
2. System:
   - Infers tags: `health`, `protection`
   - Searches semantic chunks via FAISS
   - Summarizes matching policies
   - Returns: “Here are 3 policies you might like…”
3. User: "Tell me more about Arogya Supreme Policy"
4. System:
   - Finds relevant context chunks
   - Sends them to GPT-4o for Q&A generation
   - Returns detailed answer

---

## License

This project is open-source for educational and demonstration purposes only. Use of OpenAI API is subject to their terms of service.

---

## Author

**Kishalay Ghosh**
TCS BFSI Garaje Hackathon Participant.
*Feel free to reach out via GitHub or LinkedIn for collaboration or questions.*

---
