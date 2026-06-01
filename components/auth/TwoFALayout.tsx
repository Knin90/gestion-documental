"use client";
import React from "react";

interface TwoFALayoutProps {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}

function ShootingStars() {
  return (
    <div className="shooting-stars-container">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className={`shooting_star star-${i + 1}`} />
      ))}
    </div>
  );
}

export function TwoFALayout({ title, description, icon, children }: TwoFALayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <ShootingStars />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "rgba(203,239,235,0.1)", border: "1px solid rgba(203,239,235,0.2)" }}
          >
            <span className="text-2xl" aria-hidden="true">{icon}</span>
          </div>
          <h1
            className="font-serif text-2xl font-semibold mb-1"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            {title}
          </h1>
          <p className="text-sm" style={{ color: "rgba(203,239,235,0.6)" }}>
            {description}
          </p>
        </div>
        {children}
      </div>

      <style>{`
        .shooting-stars-container {
          position: absolute;
          inset: 0;
          transform: rotateZ(45deg);
          overflow: hidden;
        }

        .shooting_star {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 2px;
          background: linear-gradient(-45deg, rgba(95, 145, 255, 1), rgba(0, 0, 255, 0));
          border-radius: 999px;
          filter: drop-shadow(0 0 6px rgba(105, 155, 255, 1));
          animation:
            tail 3000ms ease-in-out infinite,
            shooting 3000ms ease-in-out infinite;
        }

        .shooting_star::before,
        .shooting_star::after {
          content: '';
          position: absolute;
          top: calc(50% - 1px);
          right: 0;
          height: 2px;
          background: linear-gradient(-45deg, rgba(0, 0, 255, 0), rgba(95, 145, 255, 1), rgba(0, 0, 255, 0));
          border-radius: 100%;
          animation: shining 3000ms ease-in-out infinite;
        }

        .shooting_star::before {
          transform: translateX(50%) rotateZ(45deg);
        }

        .shooting_star::after {
          transform: translateX(50%) rotateZ(-45deg);
        }

        .star-1  { top: calc(50% - 120px); left: calc(50% - 50px);  animation-delay: 812ms; }
        .star-1::before, .star-1::after { animation-delay: 812ms; }
        .star-2  { top: calc(50% + 80px);  left: calc(50% - 180px); animation-delay: 2345ms; }
        .star-2::before, .star-2::after { animation-delay: 2345ms; }
        .star-3  { top: calc(50% - 190px); left: calc(50% - 270px); animation-delay: 4521ms; }
        .star-3::before, .star-3::after { animation-delay: 4521ms; }
        .star-4  { top: calc(50% + 150px); left: calc(50% - 90px);  animation-delay: 1678ms; }
        .star-4::before, .star-4::after { animation-delay: 1678ms; }
        .star-5  { top: calc(50% - 50px);  left: calc(50% - 220px); animation-delay: 3890ms; }
        .star-5::before, .star-5::after { animation-delay: 3890ms; }
        .star-6  { top: calc(50% + 30px);  left: calc(50% - 300px); animation-delay: 567ms; }
        .star-6::before, .star-6::after { animation-delay: 567ms; }
        .star-7  { top: calc(50% - 170px); left: calc(50% - 130px); animation-delay: 7234ms; }
        .star-7::before, .star-7::after { animation-delay: 7234ms; }
        .star-8  { top: calc(50% + 100px); left: calc(50% - 250px); animation-delay: 5123ms; }
        .star-8::before, .star-8::after { animation-delay: 5123ms; }
        .star-9  { top: calc(50% - 80px);  left: calc(50% - 160px); animation-delay: 8901ms; }
        .star-9::before, .star-9::after { animation-delay: 8901ms; }
        .star-10 { top: calc(50% + 180px); left: calc(50% - 200px); animation-delay: 6543ms; }
        .star-10::before, .star-10::after { animation-delay: 6543ms; }
        .star-11 { top: calc(50% - 140px); left: calc(50% - 80px);  animation-delay: 2109ms; }
        .star-11::before, .star-11::after { animation-delay: 2109ms; }
        .star-12 { top: calc(50% + 60px);  left: calc(50% - 140px); animation-delay: 4567ms; }
        .star-12::before, .star-12::after { animation-delay: 4567ms; }
        .star-13 { top: calc(50% - 30px);  left: calc(50% - 290px); animation-delay: 9012ms; }
        .star-13::before, .star-13::after { animation-delay: 9012ms; }
        .star-14 { top: calc(50% + 130px); left: calc(50% - 60px);  animation-delay: 3456ms; }
        .star-14::before, .star-14::after { animation-delay: 3456ms; }
        .star-15 { top: calc(50% - 100px); left: calc(50% - 240px); animation-delay: 7890ms; }
        .star-15::before, .star-15::after { animation-delay: 7890ms; }
        .star-16 { top: calc(50% + 40px);  left: calc(50% - 110px); animation-delay: 1234ms; }
        .star-16::before, .star-16::after { animation-delay: 1234ms; }
        .star-17 { top: calc(50% - 160px); left: calc(50% - 200px); animation-delay: 5678ms; }
        .star-17::before, .star-17::after { animation-delay: 5678ms; }
        .star-18 { top: calc(50% + 90px);  left: calc(50% - 280px); animation-delay: 8123ms; }
        .star-18::before, .star-18::after { animation-delay: 8123ms; }
        .star-19 { top: calc(50% - 70px);  left: calc(50% - 170px); animation-delay: 2890ms; }
        .star-19::before, .star-19::after { animation-delay: 2890ms; }
        .star-20 { top: calc(50% + 170px); left: calc(50% - 150px); animation-delay: 6789ms; }
        .star-20::before, .star-20::after { animation-delay: 6789ms; }

        @keyframes tail {
          0% { width: 0; }
          30% { width: 100px; }
          100% { width: 0; }
        }

        @keyframes shining {
          0% { width: 0; }
          50% { width: 30px; }
          100% { width: 0; }
        }

        @keyframes shooting {
          0% { transform: translateX(0); }
          100% { transform: translateX(300px); }
        }

        /* Fix text colors for dark background */
        .shooting-stars-container ~ div label,
        .shooting-stars-container ~ div p {
          color: rgba(203, 239, 235, 0.7) !important;
        }

        .shooting-stars-container ~ div input {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(203, 239, 235, 0.2) !important;
          color: white !important;
        }

        .shooting-stars-container ~ div button[type="button"] {
          color: rgba(203, 239, 235, 0.7) !important;
        }

        .shooting-stars-container ~ div a,
        .shooting-stars-container ~ div button:not([type="submit"]) {
          color: rgba(203, 239, 235, 0.6) !important;
        }
      `}</style>
    </div>
  );
}
