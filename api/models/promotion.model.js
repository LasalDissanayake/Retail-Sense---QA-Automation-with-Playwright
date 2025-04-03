import mongoose, { Schema } from 'mongoose';

// Promotion schema
const promotionSchema = new mongoose.Schema({
    promotionID: {
        type: Number,
        unique: true
    },
    type: {
        type: String,
        enum: ['Discount Code', 'Loyalty', 'Flash Sale', 'Bundle'],
        required: true
    },
    discountValue: {
        type: Number,
        required: false
    },
    discountPercentage: {
        type: Number,
        required: false
    },
    discountType: {
        type: String,
        enum: ['flat', 'percentage'],
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    promoCreatedDate: {
        type: Date,
        default: Date.now
    },
    promoCode: {
        type: String,
        required: true,
        unique: true
    },
    applicableProducts: [{
        type: Schema.Types.ObjectId,
        ref: 'RetrievedInventory'
    }],
    applicableCategories: [{
        type: String,
        enum: ['Men', 'Women', 'Unisex']
    }],
    minimumPurchase: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Discount validation
promotionSchema.pre('validate', function(next) {
    if (this.discountType === 'flat' && !this.discountValue && this.discountPercentage) {
        next(new Error('discountValue is required for flat discounts, not discountPercentage'));
    } else if (this.discountType === 'percentage' && !this.discountPercentage && this.discountValue) {
        next(new Error('discountPercentage is required for percentage discounts, not discountValue'));
    } else if (this.discountValue && this.discountPercentage) {
        next(new Error('Only one of discountValue or discountPercentage should be provided'));
    }
    next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;