import "./App.css";
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./views/Register";
import Login from "./views/Login";
import Profile from "./views/Profile";
import HomeTeacher from "./views/HomeTeacher";
import HomeStudent from "./views/HomeStudent";
import CreateGeofences from "./views/CreateGeofences";
import MapPageTeacher from "./views/MapPageTeacher";
import MapPageStudent from "./views/MapPageStudent";
import CreateQuestion from "./views/CreateQuestion";
import CreateAnswer from "./views/CreateAnswer";
import QuizPage from "./views/QuizPage";
import ResultsPage from "./views/ResultsPage";
import ResultsPageTeacher from "./views/ResultsPageTeacher";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomeTeacher />} />
        <Route path="/student/home" element={<HomeStudent />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/geofences" element={<CreateGeofences />} />
        <Route path="/map" element={<MapPageTeacher />} />
        <Route path="/student/map" element={<MapPageStudent />} />
        <Route path="/questions" element={<CreateQuestion />} />
        <Route path="/answers" element={<CreateAnswer />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/results/all" element={<ResultsPageTeacher />} />
      </Routes>
    </BrowserRouter>
  );
}
