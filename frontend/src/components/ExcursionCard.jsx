import "../styles/ExcursionCard.css";
import { useNavigate } from "react-router-dom";

export default function ExcursionCard({
  excursion,
  onOpen,
  onStart,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="excCard"
      onClick={() => navigate(`/geofences?excursionId=${excursion.id}`)}
    >
      <div className="excCardHeader">
        <div className="excCardTitle">{excursion.name}</div>

        <div className="excCardActions">
          <button
            type="button"
            className="excIconBtn"
            onClick={(e) => {
              e.stopPropagation();
              onStart?.(excursion);
            }}
          >
            Start
          </button>

          <button
            type="button"
            className="excIconBtn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(excursion);
            }}
          >
            Edit
          </button>

          <button
            type="button"
            className="excIconBtn danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(excursion);
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="excCardMeta">
        <span className="excLabel">Password:</span>{" "}
        <span className="excValue mono">{excursion.password}</span>
      </div>
    </div>
  );
}
