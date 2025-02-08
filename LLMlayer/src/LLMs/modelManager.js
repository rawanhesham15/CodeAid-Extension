class ModelManager {
    constructor() {
      this.models = [];
      this.currentIndex = 0;
    }
  
    addModel(model) {
      this.models.push(model);
    }
  
    async sendRequest(input) {
      while (this.currentIndex < this.models.length) {
        try {
          return await this.models[this.currentIndex].processPrompt(input);
        } catch (error) {
          console.log(`Switching to next model...`);
          this.currentIndex++;
        }
      }
      throw new Error("All models are unavailable.");
    }
  }
  
export default ModelManager;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  