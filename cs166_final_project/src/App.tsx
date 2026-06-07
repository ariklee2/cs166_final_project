import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { SignUp } from './pages/SignUp';
import { Home } from './pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path = '/signup' element = {<SignUp />}/>
        <Route path = '/home' element = {<Home />}/>
      </Routes>
    </Router>
  );
}