from flask import Flask, request, jsonify
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    user_input = data.get("message", "")

    prompt = f"""
    Sen bir sağlık asistanısın. Kullanıcının gönderdiği verileri analiz et ve basitçe anlat.
    Veriler: {user_input}
    """

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )

    reply = response['choices'][0]['message']['content']
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
