// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import { LoginPage } from '../pages/LoginPage'

// export function AppRouter() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//       </Routes>
//     </BrowserRouter>
//   )
// }

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import {SignupPage} from "../pages/SignupPage";
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}