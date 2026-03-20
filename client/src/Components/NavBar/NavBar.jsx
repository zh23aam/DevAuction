import React from "react";
import logo from "../../assets/LandingPage Images/logo remove background.svg";
import HamMenu from "../../../public/Icons/iconsmenu.png";
import GradientBtn from "../Buttons/GradientBtn";

function Navbar({ loginWithRedirect }) {
  const handleScroll = (e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    if (!href || href === "#") return;
    
    const targetId = href.replace("#", "");
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Array for the nav links
  const NavLinks = ["Home", "How it Works", "Features", "About Us", "Contact Us"]
  
  return (
    <>
      <nav className="flex justify-between items-center w-full px-5 bg-[#050618] fixed z-[1000]">
        {/* <div className="relative top-0"> X</div> */}
        <div>
          <img src={logo} alt="" className="w-24" />
        </div>
        <ul className="hidden gap-7 text-white md:flex font-thin">
          {NavLinks.map((elem) => (
            <li key={elem} >
            <a
              href={"#" + elem.toLowerCase().replace(/\s+/g, '-')}
              className=' text-white hover:font-semibold cursor-pointer hover:text-[#66bee3] relative after:content-[""] after:w-[85%] after:bg-gradient-to-r after:from-[#0a0b1d] after:via-[#66bee3] after:to-[#0a0b1d] after:absolute after:-bottom-2 after:hidden after:h-[2px] hover:after:block after:left-1/2 after:-translate-x-1/2 transition-all duration-500'
              onClick={handleScroll}
            >
              {elem}
            </a>
          </li>
          ))}
          
        </ul>

        <div className="flex" key={"loginBtn"}>
          <GradientBtn
            placeholder="LogIn"
            onClick={() => loginWithRedirect()}
            className={"text-white"}
          />
          {/* <img className="block md:hidden w-10 mx-4" src={HamMenu} alt="" /> */}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
