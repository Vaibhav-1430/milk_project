const { json, parseBody, requireAuth } = require('./_utils');
const User = require('../../models/User');

exports.handler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        return json({ success: false, message: 'Method Not Allowed' }, 405);
    }
    try {
        const user = await requireAuth(event);
        const { name, phone, customerType, hostel, address } = parseBody(event);

        if (phone) {
            const existing = await User.findOne({ phone, _id: { $ne: user._id } });
            if (existing) {
                return json({ success: false, message: 'Phone number is already in use' }, 400);
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (customerType) updateData.customerType = customerType;
        if (hostel && customerType === 'college') updateData.hostel = hostel;
        if (address) updateData.address = address;

        const updated = await User.findByIdAndUpdate(user._id, updateData, { new: true, runValidators: true });
        return json({ success: true, message: 'Profile updated successfully', data: { user: updated } });
    } catch (e) {
        return json({ success: false, message: e.message || 'Server error during profile update' }, e.statusCode || 500);
    }
};


