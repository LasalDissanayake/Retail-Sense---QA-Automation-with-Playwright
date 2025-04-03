// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // Import the Home component// Import the Dashboard component
import DashboardLayout from "./components/dashboard/DashboardLayout";
import PrivateAdmin from "./components/private/PrivateAdmin";
import FashionItem from "./pages/order/FashionItem";
import Cart from "./pages/order/Cart";
import Checkout from "./pages/order/Checkout";
import MyOrders from "./pages/order/Myorders";
import Profile from "./pages/Profile";
import PrivateCus from "./components/private/PrivateCus";
import CustomizePage from "./pages/customize/CustomizePage";

// Promotion Route




import UpdateInventory from "./pages/inventory/UpdateInventory";
import DeleteInventory from "./pages/inventory/DeleteInventory";
import InventoryManagementAll from "./components/inventory/InventoryManagementAll";
import CreateInventory from "./pages/inventory/CreateInventory";
import RetrievedInventoryTable from './components/inventory/RetrievedInventoryTable';


import AddOffer from "./components/discount&offer/AddOffer";
import PromotionReport from "./components/discount&offer/PromotionReport";
import UpdateOffer from "./components/discount&offer/UpdateOffer";

import CreateUser from "./pages/usermanagement/Createuser";
 import UpdateUser from "./pages/usermanagement/EditUser";
 //import AllUsers from "./pages/usermanagement/AllUsers";
import Oneuser from "./pages/usermanagement/Oneuser";

import Createfeedback from "./pages/feedback/Createfeedback";
// import ReadAllfeedback from "./pages/feedback/ReadAllfeedback";
 import ReadAllFeedback from "./components/dashboard/ReadAllfeedback";

 import Onefeedback from "./pages/feedback/Onefeedback";
 import EditFeedback from "./pages/feedback/EditFeedback";

export default function App() {
  return (
    // Single BrowserRouter wrapping the entire application
    <Router>
      <Routes>
        {/* Home Route */}
        <Route path="/" element={<Home />} />

        {/* Public Routes */}
        <Route path="/item/:id" element={<FashionItem />} />

        {/* Dashboard Route */}
        <Route >
          <Route path="/manager/*" element={<DashboardLayout />} />
          <Route path="/update/:id" element={<UpdateInventory />} />
          <Route path="/update/:id" element={<DeleteInventory />} />
        </Route>
        <Route element={<PrivateCus />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />{" "}
          <Route path="/customize" element={<CustomizePage />} />
        </Route>
        {/* Promotion Route */}
        <Route path="/add-offer" element={<AddOffer />}></Route>
        <Route path="/promotion-report" element={<PromotionReport />} />
        <Route path="/edit-promotion/:id" element={<UpdateOffer />} />
        <Route path="/inventory-management" element={<InventoryManagementAll />} />
        <Route path="/add-inventory" element={<CreateInventory />} />
        <Route path="/edit-inventory/:id" element={<UpdateInventory />} />
        <Route path="/retrieved-inventory" element={<RetrievedInventoryTable />} />
        {/* <Route path="/update/:id" element={<UpdateOffer />}></Route> */}
        {/* <Route path="/update/:id* " element={<DeleteOffer />}></Route> */}

        <Route path="/adduser" element={<CreateUser />}/>
         <Route path="/edituser/:id" element={<UpdateUser />}/>
        {/* <Route path="/allusers" element={<AllUsers />}/> */}
        <Route path="/user/:id" element={<Oneuser />}/> 

        <Route path="/createfeedback" element={<Createfeedback />}/>
        <Route path="/allfeedback" element={<ReadAllFeedback />}/>
        <Route path="/feedback/:id" element={<Onefeedback />}/>
        <Route path="/editfeedback/:id" element={<EditFeedback />}/>

      </Routes>
    </Router>
  );
}
