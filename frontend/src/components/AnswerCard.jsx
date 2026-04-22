import "../styles/AnswerCard.css";

export default function AnswerCard({ answer, onEdit, onDelete }) {
  return (
    <div className="answerCard">
      <div className="answerCardText">{answer.answer_text}</div>

      {answer.is_correct && (
        <div className="answerCardBadge">Correct answer</div>
      )}

      <div className="answerCardActions">
        <button
          type="button"
          className="answerIconBtn"
          onClick={() => onEdit?.(answer)}
        >
          Edit
        </button>

        <button
          type="button"
          className="answerIconBtn danger"
          onClick={() => onDelete?.(answer)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
