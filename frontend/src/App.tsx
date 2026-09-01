import { Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Register from "./pages/register";
import Login from "./pages/login";
import Profile from "./pages/profile";
import Installments from "./pages/installments";
import BankFacilityForm from "./pages/bank-facility";

import GuestRoute from "./components/guest-route";
import ProtectedRoute from "./components/protected-route";
import Layout from "./components/layout";

function App() {
  return (
    <Routes>
      {/* Guest Only */}
      <Route element={<GuestRoute />}>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Authenticated Only */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/installments" element={<Installments />} />
          <Route path="/installments/new/bank-facility" element={<BankFacilityForm />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
