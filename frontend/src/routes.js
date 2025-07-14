import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import SubmitLetter from './pages/SubmitLetter';
import HODDashboard from './pages/HODDashboard';
import ViewLetters from './pages/ViewLetters';
const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/submit" element={<SubmitLetter />} />
      <Route path="/hod" element={<HODDashboard />} />
      <Route path="/view-letters" element={<ViewLetters />} />
<Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />  
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
