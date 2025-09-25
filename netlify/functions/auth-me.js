const { json, requireAuth } = require('./_utils');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        const user = await requireAuth(event);
        return json({ success: true, data: { user } });
    } catch (e) {
        return json({ success: false, message: e.message }, e.statusCode || 401);
    }
};


