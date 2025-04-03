import mongoose from 'mongoose';

const retrievedInventorySchema = new mongoose.Schema({
    inventoryID: {
        type: Number,
        required: true
    },
    ItemName: {
        type: String,
        required: true
    },
    Category: {
        type: String,
        required: true
    },
    retrievedQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    Brand: {
        type: String,
        required: true
    },
    Sizes: [{
        type: String,
        required: false
    }],
    Colors: [{
        type: String,
        required: false
    }],
    Gender: {
        type: String,
        enum: ['Men', 'Women', 'Unisex'],
        required: false
    },
    Style: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    unitPrice: {
        type: Number,
        required: false,
        min: 0,
        default: null
    },
    finalPrice: {
        type: Number,
        required: false,
        min: 0,
        default: null
    },
    retrievedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const RetrievedInventory = mongoose.model('RetrievedInventory', retrievedInventorySchema);
export default RetrievedInventory;
