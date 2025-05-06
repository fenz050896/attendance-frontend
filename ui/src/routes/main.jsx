import React from 'react';

import DashboardPage from '../pages/main/Dashboard';
import ProfilePage from '../pages/main/Profile';
import FaceRegistrationPage from '../pages/main/FaceRegistration';
import AbsencePage from '../pages/main/Absence';

const mainRoutes = [
    { path: '', element: <DashboardPage /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'face-registration', element: <FaceRegistrationPage /> },
    { path: 'absence', element: <AbsencePage /> },
];

export default mainRoutes;
