// Home.js
import { motion } from "framer-motion"; // Import Framer Motion
import Navbar from "../components/Navbar";
import HomeCon from "../components/HomeCon";
import Collection from "../components/Collection";
import Products from "../components/Products";
import Review from "../components/Review";
import Footer from "../components/Footer";
import Shop from "../components/Shop";
import CustomizeDress from "../components/CustomizeDress";

// Animation Variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 50,
      damping: 20,
      staggerChildren: 0.2, // Adds delay between child animations
    },
  },
};

const componentVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export default function Home() {
  return (
    <div>
      <Navbar />

      {/* Home Section */}
      <motion.div
        id="home"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={componentVariants}>
          <HomeCon />
        </motion.div>
      </motion.div>

      {/* Customize Dress Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={componentVariants}>
          <CustomizeDress />
        </motion.div>
      </motion.div>

      {/* Shop Section */}
      {/* <motion.div
        id="shop"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={componentVariants}>
          <Shop />
        </motion.div>
      </motion.div> */}

      {/* Collection Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={componentVariants}>
          <Collection />
        </motion.div>
      </motion.div>

      {/* Products Section */}
      <motion.div
        id="products"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={componentVariants}>
          <Products />
        </motion.div>
      </motion.div>

      {/* Review Section */}
      <motion.div
        id="review"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={componentVariants}>
          <Review />
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={componentVariants}>
          <Footer />
        </motion.div>
      </motion.div>
    </div>
  );
}
