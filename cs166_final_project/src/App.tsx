import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { SignUp } from './pages/SignUp';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Bid } from './pages/Bid';
import { UserProfile } from './pages/UserProfile';
import { Checkout } from "./pages/Checkout"; 
import { Shipping } from "./pages/Shipping"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path = '/signup' element = {<SignUp />}/>
        <Route path = '/login' element = {<Login />}/>
        <Route path = '/home' element = {<Home />}/>
        <Route path = "/bid" element = {<Bid />}/>
        <Route path = "/profile" element = {<UserProfile />}/>
        <Route path = "/checkout" element = {<Checkout />}/>
        <Route path = "/shipping" element = {<Shipping />}/>
      </Routes>
    </Router>
  );
}