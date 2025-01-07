import express from "express";
import cors from "cors";
import { Groundx } from "groundx-typescript-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

const groundx = new Groundx({
    apiKey: process.env.GROUNDX_API_KEY
});

app.use(express.json());

// Route
app.post("/query", async (req, res) => {
    const { bucketId, queryString, n } = req.body;

    // Validate the input
    if (!bucketId || !queryString || !n) {
        return res.status(400).send({
            error: "Please provide bucketId, queryString, and n in the request body."
        });
    }

    try {
        // Fetch content from GroundX using the provided query
        const result = await groundx.search.content({
            id: bucketId,
            query: queryString,
            n: n
        });

        const llmText = result.data.search.text;

        // Construct the completion prompt based on GroundX content
        const prompt = `
You are a knowledge assistant. Use the content below to generate a concise, clear, and informative response to the user's query. Your answer should focus only on the relevant information that directly answers the user's question. Always include the source of the content in your answer. If the content does not provide enough information to answer the query, respond with: "I don't have sufficient information to respond."

=== Content ===
${llmText}
=== End of Content ===

User Query:
${queryString}
`;

        // Send the constructed prompt back as the response
        res.send({
            userQuery: queryString,
            groundxResponse: llmText,
            prompt: prompt
        });
    } catch (error) {
        console.error("Error occurred while processing the request:", error);
        res.status(500).send({
            error: "An error occurred while processing your request.",
            details: error.message  // Include error details for debugging
        });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
