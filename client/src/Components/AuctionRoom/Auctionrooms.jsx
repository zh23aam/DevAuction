import React, { useCallback, useEffect, useState } from "react";
import Card from "./Card";
import "./Auctionroom.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import DotPaginator from "./DotPaginator";
import GradientBtn from "../Buttons/GradientBtn";
import PrimaryButton from "../Common/PrimaryButton";
import { IoIosArrowDown } from "react-icons/io";
import { RiRefreshLine } from "react-icons/ri";
import api from "../../utils/api";

const Auctionrooms = ({ show, setshow, showdownload, setShowdownload }) => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(3);
  const [selectOption, setSelectOption] = useState("free");
  const roomOptions = ["free", "history"];
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [roomData, setRoomData] = useState({
    freeRooms: [],
    history: [],
  });

  const fetchRooms = useCallback(async (type = "all") => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post("/dashboard/getRooms", { type });
      
      if (type === "all") {
        setRoomData(data);
      } else {
        // Update only the specific type
        setRoomData((prev) => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.error("Auction Rooms Fetch Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms("all");
  }, [fetchRooms]);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const currentRooms = selectOption === "free" ? roomData.freeRooms : roomData.history;

  return (
    <div className="bg-[#050618] flex flex-col gap-4">
      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-8">
          <div className="text-[28px] md:text-[40px] font-semibold flex items-center text-white">
            Auction Room
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <GradientBtn
              placeholder="Create Rooms"
              onClick={() => setshow(!show)}
            />
            <GradientBtn
              placeholder="Download"
              onClick={() => setShowdownload(!showdownload)}
            />
          </div>
        </div>
        
        <div className="header flex justify-between items-center sm:pr-28 flex-wrap gap-4">
          <div
            className="bg-inherit w-52 text-center outline-none cursor-pointer rounded-xl relative"
            style={{
              backgroundColor: "rgba(7, 38, 67, 1)",
              boxShadow: "0 2.93px 3.67px 1.47px rgba(121, 197, 239, 0.38)",
            }}
          >
            <div
              className="w-full flex justify-between items-center p-6 py-2 capitalize font-semibold"
              onClick={() => setShowOptions(!showOptions)}
            >
              {selectOption}{" "}
              <IoIosArrowDown
                className={`mt-1 transition-transform duration-500 ${
                  showOptions ? "rotate-180" : ""
                }`}
              />
            </div>
            {showOptions && (
              <div
                className="optionsConatiner top-14 absolute w-full left-0 rounded-xl z-50 overflow-hidden"
                style={{
                  backgroundColor: "rgba(7, 38, 67, 1)",
                  boxShadow: "0 2.93px 3.67px 1.47px rgba(121, 197, 239, 0.38)",
                }}
              >
                {roomOptions.map((elem) => (
                  <div
                    className="px-4 py-2 hover:bg-blue-950 active:text-sm h-10"
                    key={elem}
                    onClick={() => {
                      setSelectOption(elem);
                      setShowOptions(false);
                      // fetchRooms(elem); // Optional: fetch only this type if needed
                    }}
                  >
                    {elem}
                  </div>
                ))}
              </div>
            )}
          </div>
          <PrimaryButton
            label={isLoading ? "Refreshing..." : "Refresh"}
            onClick={() => !isLoading && fetchRooms(selectOption)}
            variant="outline"
            disabled={isLoading}
            icon={RiRefreshLine}
            className={isLoading ? "animate-pulse" : ""}
          />
        </div>

        <div className="flex flex-col justify-center items-center w-full min-h-[300px]">
          {error ? (
            <div className="text-red-500 text-center">
              <p>Error: {error}</p>
              <button onClick={() => fetchRooms(selectOption)} className="underline">Retry</button>
            </div>
          ) : isLoading && currentRooms.length === 0 ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p>Searching for rooms...</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-evenly transition-all duration-200">
              {currentRooms.length === 0 ? (
                <p className="text-gray-500 mt-10">No {selectOption} rooms found.</p>
              ) : (
                currentRooms.map((elem, index) => (
                  <Card
                    roomId={elem.RoomID}
                    bidCount={elem.Bids?.length || 0}
                    date={elem.Time}
                    imgSrc={elem.Image}
                    title={elem.Title}
                    status={elem.Status}
                    key={elem.RoomID + index}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <DotPaginator
        className="bg-[#050618] custom-paginator"
        first={first}
        rows={rows}
        totalRecords={currentRooms.length}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default Auctionrooms;

// "premium"
// ? roomData.premiumRooms.map((elem, index) => (
//     <Card
//       roomId={elem.RoomID}
//       date={elem.Time}
//       imgSrc={elem.Image}
//       title={elem.Title}
//       key={elem.RoomID + index}
//     />
//   ))
// :
