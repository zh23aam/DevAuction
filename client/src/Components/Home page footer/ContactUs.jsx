import api from "../../utils/api";
import React, { useState } from "react";
import GradientBtn from "../Buttons/GradientBtn";
import { useToast } from "../../context/ToastContext";

function ContactUs() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isAcceptChecked, setIsAcceptChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!isAcceptChecked) {
      showToast("Please accept T&C first", "red");
      return;
    }

    const { firstName, lastName, email, phone, message } = formData;

    if (!firstName || !lastName || !email || !phone || !message) {
      showToast("Please fill in all details", "red");
      return;
    }

    if (!validateEmail(email)) {
      showToast("Enter a valid email address", "red");
      return;
    }

    setIsLoading(true);
    try {
      const details = {
        Name: `${firstName} ${lastName}`,
        Email: email,
        PhoneNo: phone.toString(),
        Message: message,
      };

      await api.post("/contactus", details);

      showToast("Thank You for contacting us!", "green");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: ""
      });
      setIsAcceptChecked(false);
    } catch (error) {
      console.error("Contact Form Error:", error);
      showToast(error.message || "Failed to send message", "red");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact-us" className="text-white py-10">
      <div className="flex w-full justify-center flex-wrap gap-4 items-center text-white py-10 ">
        <div className="max-w-[40vw] bg-[#0f1325]/80 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl min-w-[320px] overflow-hidden">
          <form
            onSubmit={handleSubmit}
            className="w-full mx-auto py-8 px-8 flex flex-col gap-6"
          >
            <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Contact Form</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-[#0CA3E7]/20 rounded-2xl transition-all">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ml-2">First Name</label>
                <input
                  className="outline-none bg-black/20 border border-white/10 w-full rounded-xl px-4 py-2.5 h-11 text-white text-sm focus:bg-black/30 focus:border-[#0CA3E7]/30 transition-all placeholder:text-gray-600 shadow-inner"
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-[#0CA3E7]/20 rounded-2xl transition-all">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ml-2">Last Name</label>
                <input
                  className="outline-none bg-black/20 border border-white/10 w-full rounded-xl px-4 py-2.5 h-11 text-white text-sm focus:bg-black/30 focus:border-[#0CA3E7]/30 transition-all placeholder:text-gray-600 shadow-inner"
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-[#0CA3E7]/20 rounded-2xl transition-all">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ml-2">Phone</label>
                <input
                  type="tel"
                  className="outline-none bg-black/20 border border-white/10 w-full rounded-xl px-4 py-2.5 h-11 text-white text-sm focus:bg-black/30 focus:border-[#0CA3E7]/30 transition-all placeholder:text-gray-600 shadow-inner"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 987..."
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-[#0CA3E7]/20 rounded-2xl transition-all">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ml-2">Email</label>
                <input
                  className="outline-none bg-black/20 border border-white/10 w-full rounded-xl px-4 py-2.5 h-11 text-white text-sm focus:bg-black/30 focus:border-[#0CA3E7]/30 transition-all placeholder:text-gray-600 shadow-inner"
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 focus-within:ring-1 focus-within:ring-[#0CA3E7]/20 rounded-2xl transition-all">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ml-2">Message</label>
              <textarea
                rows={3}
                className="outline-none bg-black/20 border border-white/10 w-full rounded-xl px-4 py-3 min-h-[100px] text-white text-sm focus:bg-black/30 focus:border-[#0CA3E7]/30 transition-all placeholder:text-gray-600 shadow-inner resize-none"
                id="message"
                value={formData.message}
                placeholder="Tell us what's on your mind..."
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="flex items-start gap-3 px-1">
              <input
                type="checkbox"
                id="checkbox"
                checked={isAcceptChecked}
                onChange={() => setIsAcceptChecked(!isAcceptChecked)}
                className="mt-1 w-4 h-4 rounded border-gray-700 bg-black/20 text-[#0CA3E7] focus:ring-[#0CA3E7]/20"
                required
              />
              <label htmlFor="checkbox" className="text-xs text-gray-400 leading-tight">
                By sending this form I confirm that I have read and accept the{" "}
                <a
                  className="text-white hover:text-[#0CA3E7] transition-colors underline decoration-white/20 underline-offset-4"
                  href="#"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <GradientBtn
              type="submit"
              placeholder={isLoading ? "Submitting..." : "Send Message"}
              className="w-full md:w-48 self-start mt-2"
              disabled={isLoading}
            />
          </form>
        </div>
        <div id="star" className="w-[300px] ml-10 relative ">
          <h4 className="font-semibold mb-2">Stay Updated</h4>
          <p className="text-xs opacity-55">
            At DevAuction, our constant pursuit is to build an engaging community
            that spreads joy. Don't hesitate to reach out to us with your
            thoughts and messages - we are all ears!
          </p>
        </div>
      </div>
    </section>
  );
}

export default ContactUs;
