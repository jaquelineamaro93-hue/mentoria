import { useCallback } from "react";

export function useConfetti() {
  return useCallback(() => {
    const confettiPieces = 50;
    for (let i = 0; i < confettiPieces; i++) {
      const confetti = document.createElement("div");
      confetti.style.position = "fixed";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.top = "-10px";
      confetti.style.width = "10px";
      confetti.style.height = "10px";
      confetti.style.backgroundColor = ["#B298E7", "#FF857A", "#ADEBB3", "#6B403C"][
        Math.floor(Math.random() * 4)
      ];
      confetti.style.borderRadius = "50%";
      confetti.style.animation = `confetti-fall ${2 + Math.random()}s linear forwards`;
      confetti.style.setProperty("--tx", (Math.random() - 0.5) * 200 + "px");
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  }, []);
}
