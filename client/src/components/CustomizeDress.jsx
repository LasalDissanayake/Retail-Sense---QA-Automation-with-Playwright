import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import img from "../assets/img/collection.png";

const CustomizeDress = () => {
  return (
    <div className="w-full bg-gradient-to-r from-purple-100 to-pink-100 py-16">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <motion.div 
          className="md:w-1/2 mb-8 md:mb-0"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-purple-700 mb-4">Customize Your Dream Dress</h2>
          <p className="text-lg text-gray-700 mb-6">
            Create your perfect outfit with our state-of-the-art dress customization tool. 
            Express your unique style and bring your fashion vision to life!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold 
                     hover:bg-purple-700 transition-all duration-300 shadow-lg"
          >
            <Link to="/customize">Start Designing Now</Link>
          </motion.button>
        </motion.div>
        
        <motion.div 
          className="md:w-1/2"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative">
            <img 
              src={img} 
              alt="Dress Customization" 
              className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-500"
            />
            <motion.div
              className="absolute -top-4 -right-4 bg-pink-500 text-white px-4 py-2 rounded-full"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              New Feature!
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomizeDress;
