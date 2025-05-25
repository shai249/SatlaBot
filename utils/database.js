const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
    if (isConnected) {
        console.log('Database already connected');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        isConnected = true;
        console.log('✅ MongoDB connected successfully');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            isConnected = false;
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            isConnected = true;
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
};

const disconnectDatabase = async () => {
    if (!isConnected) return;
    
    try {
        await mongoose.connection.close();
        isConnected = false;
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};

module.exports = {
    connectDatabase,
    disconnectDatabase,
    isConnected: () => isConnected
};
