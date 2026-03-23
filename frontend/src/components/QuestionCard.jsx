import "../styles/QuestionCard.css";

export default function QuestionCard({
  question,
  onEdit,
  onDelete,
  onOpenAnswers,
}) {
  return (
    <div
      className="excCard"
      onClick={() => onOpenAnswers?.(question)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onOpenAnswers?.(question);
        }
      }}
    >
      <div className="excCardTitle">{question.question_text}</div>

      <div className="excCardActions">
        <button
          type="button"
          className="excIconBtn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(question);
          }}
        >
          Edit
        </button>

        <button
          type="button"
          className="excIconBtn danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(question);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
