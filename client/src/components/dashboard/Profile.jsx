import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Admin",
    mobile: "0123456789", // Add default mobile number
  });

  const [editProfile, setEditProfile] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({ ...profile });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Validate UserName field (cannot be empty)
    if (!updatedProfile.name.trim()) {
      newErrors.name = "Name is required.";
    }
  
    // Validate email field (should be a valid email format)
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!updatedProfile.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailPattern.test(updatedProfile.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
  
    // Validate mobile number (must be exactly 10 digits)
    const mobilePattern = /^[0-9]{10}$/;
    if (!updatedProfile.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!mobilePattern.test(updatedProfile.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits.";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleProfileUpdate = () => {
    // Validate the form before updating
    if (validateForm()) {
      setProfile(updatedProfile);
      setEditProfile(false);
    }
  };

  return (
    <motion.div
      className="p-10 bg-PrimaryColor min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-ExtraDarkColor mb-6">Profile</h1>
      <div className="bg-SecondaryColor p-8 rounded-lg shadow-md w-full max-w-lg">
        {!editProfile ? (
          <div>
            <p className="text-DarkColor mb-4">
              <strong>Name:</strong> {profile.name}
            </p>
            <p className="text-DarkColor mb-4">
              <strong>Email:</strong> {profile.email}
            </p>
            <p className="text-DarkColor mb-4">
              <strong>Mobile Number:</strong> {profile.mobile}
            </p>
            <p className="text-DarkColor mb-4">
              <strong>Role:</strong> {profile.role}
            </p>
            <button
              className="bg-DarkColor text-white p-3 rounded mt-4 hover:bg-ExtraDarkColor transition"
              onClick={() => setEditProfile(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-semibold text-DarkColor mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={updatedProfile.name}
                className="p-3 w-full bg-PrimaryColor rounded border border-gray-300"
                onChange={(e) =>
                  setUpdatedProfile({ ...updatedProfile, name: e.target.value })
                }
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-DarkColor mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={updatedProfile.email}
                className="p-3 w-full bg-PrimaryColor rounded border border-gray-300"
                onChange={(e) =>
                  setUpdatedProfile({ ...updatedProfile, email: e.target.value })
                }
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="mobile" className="block text-sm font-semibold text-DarkColor mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                id="mobile"
                value={updatedProfile.mobile}
                className="p-3 w-full bg-PrimaryColor rounded border border-gray-300"
                onChange={(e) =>
                  setUpdatedProfile({ ...updatedProfile, mobile: e.target.value })
                }
              />
              {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
            </div>

            <button
              className="bg-DarkColor text-white p-3 rounded mt-4 hover:bg-ExtraDarkColor transition"
              onClick={handleProfileUpdate}
            >
              Save Changes
            </button>
            <button
              className="bg-ExtraDarkColor text-white p-3 rounded mt-4 hover:bg-DarkColor transition ml-4"
              onClick={() => setEditProfile(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
