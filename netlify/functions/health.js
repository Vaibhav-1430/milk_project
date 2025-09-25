exports.handler = async () => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'OK',
            message: 'GaramDoodh API is running',
            timestamp: new Date().toISOString()
        })
    };
};


