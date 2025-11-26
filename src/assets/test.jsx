import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function TestGemini() {
  const [response, setResponse] = useState("");

  useEffect(() => {
    async function run() {
      const ai = new GoogleGenerativeAI(import.meta.env.VITE_geminiApiKey);
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });


      const result = await model.generateContent(
        "WHO IS GOING TO BE THE KING OF THE PIRATES"
      );

      setResponse(result.response.text());
    }

    
  }, []);

  return (
    <div>
      <h1>AI Response:</h1>
      <p>{response}</p>
    </div>
  );
}

