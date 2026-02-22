import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const SortableList = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition,
        // Important to have mobile touch-dragging work as expected dnd-kit handles this.
        touchAction: "none",
      }}
    >
      {props.children}
    </div>
  );
};

export default SortableList;
