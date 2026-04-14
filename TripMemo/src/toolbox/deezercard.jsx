import { Group, Image as KonvaImage, Text, Rect } from "react-konva";
import useImage from "use-image";

const FONTS = ["Arial", "Georgia", "Courier New", "Verdana", "Times New Roman"];

const FRAMES = [
  { id: "none",     label: "None"      },
  { id: "white",    label: "White"     },
  { id: "black",    label: "Black"     },
  { id: "polaroid", label: "Polaroid"  },
  { id: "rounded",  label: "Rounded"   },
  { id: "shadow",   label: "Shadow"    },
];

export { FONTS, FRAMES };

export default function DeezerCard({
  it,
  isSelected,
  tool,
  onSelect,
  onDragEnd,
  onResize,
  snap,
  nodeRef,
  onContextMenu,
}) {
  const [img] = useImage(it.src, "anonymous");
  if (!img) return null;

  const frame      = it.frame      ?? "none";
  const fontFamily = it.fontFamily ?? "Arial";
  const fontColor  = it.fontColor  ?? "#000000";
  const fontSize   = it.fontSize   ?? 16;

  // ── Frame geometry ──────────────────────────────────────────────────────
  const PAD_POLAROID = { top: 8, side: 8, bottom: 36 };
  const PAD_BORDER   = { top: 6, side: 6, bottom: 6 };
  const PAD_NONE     = { top: 0, side: 0, bottom: 0 };

  const pad =
    frame === "polaroid"                          ? PAD_POLAROID :
    ["white", "black", "rounded", "shadow"].includes(frame) ? PAD_BORDER   :
    PAD_NONE;

  const frameW = it.w + pad.side * 2;
  const frameH = it.h + pad.top + pad.bottom;

  // ── Frame visual props ──────────────────────────────────────────────────
  const frameProps = (() => {
    switch (frame) {
      case "white":    return { fill: "#ffffff", stroke: "#d0d0d0", strokeWidth: 1, cornerRadius: 4,  shadowBlur: 0  };
      case "black":    return { fill: "#111111", stroke: "#000000", strokeWidth: 1, cornerRadius: 4,  shadowBlur: 0  };
      case "polaroid": return { fill: "#ffffff", stroke: "#e0e0e0", strokeWidth: 1, cornerRadius: 2,  shadowBlur: 0  };
      case "rounded":  return { fill: "#ffffff", stroke: "#cccccc", strokeWidth: 1, cornerRadius: 16, shadowBlur: 0  };
      case "shadow":   return { fill: "#ffffff", stroke: "#e0e0e0", strokeWidth: 1, cornerRadius: 4,  shadowBlur: 12, shadowColor: "rgba(0,0,0,0.35)", shadowOffsetX: 3, shadowOffsetY: 3 };
      default:         return null;
    }
  })();

  const imgX = pad.side;
  const imgY = pad.top;

  return (
    <Group
      ref={nodeRef}
      x={it.x}
      y={it.y}
      draggable={tool === "selection"}
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      onTransformEnd={(e) => {
        const node = e.target;
        const sx = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        const newSize = Math.max(40, snap(it.w * sx));
        onResize(it.id, {
          x: snap(node.x()),
          y: snap(node.y()),
          w: newSize,
          h: newSize,
        });
      }}
    >
      {/* FRAME */}
      {frameProps && (
        <Rect
          x={0}
          y={0}
          width={frameW}
          height={frameH}
          {...frameProps}
        />
      )}

      {/* IMAGE */}
      <KonvaImage
        image={img}
        x={imgX}
        y={imgY}
        width={it.w}
        height={it.h}
        cornerRadius={frame === "rounded" ? 10 : 0}
        stroke={isSelected ? "dodgerblue" : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />

      {/* TEXT — sits below frame if no frame, inside polaroid bottom strip otherwise */}
      <Text
        x={0}
        y={frame === "polaroid" ? imgY + it.h + 4 : frameH + 8}
        width={frameW || it.w}
        text={`${it.title}\n${it.artist}`}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={fontColor}
        align="center"
      />
    </Group>
  );
}