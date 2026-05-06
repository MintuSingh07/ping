const app = require("./src/app");
const { initializeWhatsApp } = require("./src/services/whatsapp.service");

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Initialize WhatsApp service on startup
    try {
        await initializeWhatsApp();
    } catch (error) {
        console.error("Failed to initialize WhatsApp service on startup:", error);
    }
});