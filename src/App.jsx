import { Route, Routes } from "react-router-dom";
import GlabalPage from "./components/GlabalPage";
import Entrance from "./components/Entrance";
import Customer from "./components/Customer";
import Chef from "./components/Chef";
import ChefsPage from "./components/ChefsPage";
import OrdersPage from "./components/OrdersPage";
import ChefProfilePage from "./components/ChefProfilePage";
import ChefProfileFamous from "./components/ChefProfileFamous";
import LikePage from "./components/LikePage";
import ProfilePage from "./components/ProfilePage";
import EditProfilePage from "./components/EditProfilePage";
import NotificationBell from "./components/NotificationBell";
import ChefHomePage from "./components/ChefHomePage";
import ChefProfileOwnPage from "./components/ChefProfileOwnPage";
import ChefMessagesPage from "./components/ChefMessagesPage";
import ChefEditProfilePage from "./components/ChefEditProfilePage";
import ChefViewPage from "./components/ChefViewPage";
import ChefAllReviewsPage from "./components/ChefAllReviewsPage";
import AddReviewPage from "./components/AddReviewPage";
import AdminPage from "./components/AdminPage";
import AdminChefsPage from "./components/AdminChefsPage";
import AdminCustomersPage from "./components/AdminCustomersPage";
import AdminOrdersPage from "./components/AdminOrdersPage";
import AdminRevenuePage from "./components/AdminRevenuePage";

const App = () => {
  // App birinchi ochilganda eski offline cheflarni tozalash
  // (browser yopilganda setOffline ishlamagan bo'lishi mumkin)
  // Har safar app ochilganda 2 daqiqadan eski heartbeatli cheflarni tozalamaslik —
  // ularning registeredChefs da qolishi kerak, faqat ONLINE filtr GlabalPage da ishlaydi
  return (
    <Routes>
      <Route path="/" element={<Entrance />} />
      <Route path="/customer" element={<Customer />} />
      <Route path="/glabal" element={<GlabalPage />} />
      <Route path="/chef" element={<Chef />} />
      <Route path="/chefspage" element={<ChefsPage />} />
      <Route path="/orderspage" element={<OrdersPage />} />
      <Route path="/chef/:id" element={<ChefProfilePage />} />
      <Route path="/cheffamous/:id" element={<ChefProfileFamous />} />
      <Route path="/like" element={<LikePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/edit-profile" element={<EditProfilePage />} />
      <Route path="/notification" element={<NotificationBell />} />
      <Route path="/chef-home" element={<ChefHomePage />} />
      <Route path="/chef-profile" element={<ChefProfileOwnPage />} />
      <Route path="/chef-messages" element={<ChefMessagesPage />} />
      <Route path="/chef-edit-profile" element={<ChefEditProfilePage />} />
      <Route path="/chef-view/:id" element={<ChefViewPage />} />
      <Route path="/chef-all-reviews" element={<ChefAllReviewsPage />} />
      <Route path="/add-review" element={<AddReviewPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/chefs" element={<AdminChefsPage />} />
      <Route path="/admin/customers" element={<AdminCustomersPage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/admin/revenue" element={<AdminRevenuePage />} />
    </Routes>
  );
};

export default App;