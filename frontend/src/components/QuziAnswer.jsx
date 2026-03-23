import "../styles/QuizAnswer.css";

export default function QuizAnswer({
  text,
  isSelected,
  onClick,
  disabled = false,
}) {
  return (
    <button
      className={`answer-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {text}
    </button>
  );
}
