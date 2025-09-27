const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    picture: {
        type: String
    },
    phone: {
        type: String,
        required: function() {
            return !this.googleId; // Not required for Google OAuth users
        },
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // Not required for Google OAuth users
        },
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    customerType: {
        type: String,
        enum: ['college', 'outsider'],
        default: 'outsider'
    },
    hostel: {
        type: String,
        required: function() {
            return this.customerType === 'college';
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
