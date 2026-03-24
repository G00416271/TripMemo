import { Group, Image as KonvaImage, Text } from "react-konva";
import useImage from "use-image";

export default function DeezerCard({
  it,
  isSelected,
  tool,
  onSelect,
  onDragEnd,
  nodeRef,
}) {
  const [img] = useImage(it.src, "anonymous");

  if (!img) return null;

  return (
    <Group
      ref={nodeRef}
      x={it.x}
      y={it.y}
      draggable={tool === "selection"}
      onMouseDown={onSelect}
      onDragEnd={onDragEnd}
    >
      {/* IMAGE */}
      <KonvaImage
        image={img}
        width={it.w}
        height={it.h}
        stroke={isSelected ? "dodgerblue" : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />

      {/* TEXT */}
      <Text
        y={it.h + 8}
        text={`${it.title}\n${it.artist}`}
        fontSize={16}
        fill="black"
      />
    </Group>
  );
}