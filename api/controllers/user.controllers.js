import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";

// Create a new User
export const createUser = async (req, res) => {
  try {
    const { UserName, email, password, address, mobile, role } = req.body;

    // Hash the password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Ensure role is either "manager" or defaults to "customer"
    // const userRole = role === "manager" ? "manager" : "customer";

    const newUser = new User({
      UserName,
      email,
      password: hashedPassword,
      address,
      mobile,
      role,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { UserName, email, address, mobile, role } = req.body;

    // Ensure UserName is required
    if (!UserName) {
      return res.status(400).json({ success: false, message: "UserName is required" });
    }

    // Ensure mobile is exactly 10 digits
    const mobilePattern = /^[0-9]{10}$/;
    if (!mobile || !mobilePattern.test(mobile)) {
      return res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits" });
    }

    // Ensure role is either "manager" or defaults to "customer"
    const userRole = role === "manager" ? "manager" : "customer";

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { UserName, email, address, mobile, role: userRole },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
