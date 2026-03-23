import "./App.css";
import Dashbord from "./Pages/Dashboardpage/Dashbord";
import Gallery from "./Components/GallerySection/Gallery";
import Preview from "./Pages/preview/Preview";
import HomePage from "./Pages/Home page/HomePage";
import AuctionRoom from "./Pages/AuctionRoom";
import Auctionrooms from "./Components/AuctionRoom/Auctionrooms";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LandingPage from "./Pages/Landing page/LandingPage";
import Profile from "./Pages/Profile page/Profile";
import Chat from "./Pages/Chat page/Chat";
import { MenuProvider } from "./context/MenuContextProvider";
import ErrorBoundary from "./Components/Common/ErrorBoundary";
import ErrorSection from "./Components/Common/ErrorSection";
import { ToastProvider } from "./context/ToastContext";
import AuctionSummary from "./Pages/Auction/AuctionSummary";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: (
      <div className="min-h-screen bg-[#050618] flex items-center justify-center">
        <ErrorSection 
          title="Page Not Found" 
          message="The page you are looking for doesn't exist or has been moved." 
          onRetry={() => window.location.href = "/"}
        />
      </div>
    ),
  },
  {
    path: "/homepage/", 
    element: <HomePage />, 
    children: [
      { path: "/homepage/dashboard", element: <Dashbord /> },
      { path: "/homepage/profile/:id?", element: <Profile /> },
      { path: "/homepage/chats", element: <Chat /> },
      { path: "/homepage/gallery" , element: <Gallery/> },
      { path: "/homepage/gallery/preview/:id" , element: <Preview />},
      {path: "/homepage/auction", element: <Auctionrooms />},
      {path:"/homepage/auction/:auctionId/summary", element: <AuctionSummary />}
    ],
  },
  {path: "/auction/:auctionId", element: <AuctionRoom />},
]);

function App() {
  return (
    <ToastProvider>
      <MenuProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </MenuProvider>
    </ToastProvider>
  );
}

export default App;
