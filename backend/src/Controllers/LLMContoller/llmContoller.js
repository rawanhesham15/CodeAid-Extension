const ModelManager = require("../../LLMs/modelManager");

const modelManager = new ModelManager();
const DeepSeekHandler = require("../../LLMs/deepseekHandler");
const GemeniHandler = require("../../LLMs/gemeniHandler");

modelManager.addModel(new DeepSeekHandler()); // Primary model
modelManager.addModel(new GemeniHandler()); // Fallback model

exports.generateResponse = async (prompt) => {
    try {
        return await modelManager.sendRequest(prompt);
    } catch (error) {
        throw new Error(error.message);
    }
};