import feedback from '../models/feedback.model.js';

//Create new feedback

export const createFeedback = async (req, res) => {
    try {
        const { userID, rating, comment } = req.body; // Change customerID to userID
        const newFeedback = new feedback({
            userID,  // Using userID instead of customerID
            rating,
            comment,
        });
        await newFeedback.save();
        res.status(201).json({ success: true, message: 'Feedback created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


//Get all feedback

export const getAllFeedback = async (req, res) => {
    try {
        const feedbacks = await feedback.find();
        res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//Get feedback by customerID

export const getFeedbackByCustomerID = async (req, res) => {
    try {
        const feedbacks = await feedback.find({ customerID: req.params.customerID });
        res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//Get feedback by productID

export const getFeedbackByProductID = async (req, res) => {
    try {
        const feedbacks = await feedback.find({ productID: req.params.productID });
        res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//Update feedback

// export const updateFeedback = async (req, res) => {
//     try {
//         const feedback = await feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
//         res.status(200).json({ success: true, data: feedback, message: 'Feedback updated successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };
export const updateFeedback = async (req, res) => {
    try {
      const { customerID, rating, comment } = req.body;
      const updateFeedback = await feedback.findByIdAndUpdate(
        req.params.id,
        { customerID, rating, comment },
        { new: true, runValidators: true }
      );
      if (!updateFeedback) {
        return res.status(404).json({ success: false, message: "Feedback not found" });
      }
      res.status(200).json({ success: true, data: updateFeedback, message: "Feedback updated successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
//Delete feedback

export const deleteFeedback = async (req, res) => {
    try {
        // Validate ObjectId
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: "Invalid feedback ID format" });
        }

        const deletedFeedback = await feedback.findByIdAndDelete(req.params.id);
        if (!deletedFeedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
    } catch (error) {
        console.error("Delete Feedback Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//Average rating for a product

export const getAverageRating = async (req, res) => {
    try {
        const feedbacks = await feedback.find({ productID: req.params.productID });
        if (!feedbacks) return res.status(404).json({ success: false, message: 'No feedback found for this product' });

        let totalRating = 0;
        feedbacks.forEach((feedback) => {
            totalRating += feedback.rating;
        });

        const averageRating = totalRating / feedbacks.length;
        res.status(200).json({ success: true, data: averageRating, message: 'Average rating calculated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


















