const http = require("http");
const app = require("./src/app");
const { initializeWhatsApp } = require("./src/services/whatsapp.service");
const socketService = require("./src/services/socket.service");

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Initialize Socket.io
socketService.initialize(server);

server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Initialize WhatsApp service on startup
    try {
        await initializeWhatsApp();
    } catch (error) {
        console.error("Failed to initialize WhatsApp service on startup:", error);
    }
});

// Graceful shutdown
const { client } = require("./src/services/whatsapp.service");
process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    try {
        await client.destroy();
        console.log("WhatsApp client destroyed.");
    } catch (err) {
        console.error("Error destroying WhatsApp client:", err);
    }
    process.exit(0);
});