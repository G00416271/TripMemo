import React, { useState, useRef, useEffect } from "react";
import { GripHorizontal, Image as ImageIcon, FileText, StickyNote } from "lucide-react";

const MediaDock = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Relative to center bottom
  const dockRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Initial center positioning
  useEffect(() => {
    if(dockRef.current) {
        // Just let CSS center it initially
    }
  }, []);

  const handleMouseDown = (e) => {
    // Only drag if clicking the handle
    if (e.target.closest('.drag-handle')) {
        setIsDragging(true);
        const rect = dockRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const onDragStart = (e, type, src) => {
    e.dataTransfer.setData("type", type);
    if(src) e.dataTransfer.setData("src", src);
    e.dataTransfer.effectAllowed = "copy";
  };

  const widgets = [
      { id: 'img1', type: 'image', icon: ImageIcon, label: 'Image', src: 'https://picsum.photos/300/200' },
      { id: 'txt1', type: 'text_widget', icon: FileText, label: 'Text', src: '' },
      { id: 'note1', type: 'image', icon: StickyNote, label: 'Sticky', src: 'https://placehold.co/200x200/feff9c/000000.png?text=Note&font=kalam' }
  ];

  return (
    <div
        ref={dockRef}
        className="fixed bg-white/90 backdrop-blur-sm border border-slate-200 shadow-2xl rounded-2xl flex flex-col p-2 z-50 transition-shadow hover:shadow-xl"
        style={{
            left: isDragging || position.x !== 0 ? position.x : '50%',
            top: isDragging || position.y !== 0 ? position.y : 'auto',
            bottom: isDragging || position.y !== 0 ? 'auto' : '20px',
            transform: isDragging || position.x !== 0 ? 'none' : 'translateX(-50%)',
            cursor: isDragging ? 'grabbing' : 'auto'
        }}
        onMouseDown={handleMouseDown}
    >
        {/* Drag Handle */}
        <div className="drag-handle w-full flex justify-center py-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
            <GripHorizontal size={16} />
        </div>

        {/* Widgets Grid */}
        <div className="flex gap-4 p-2 items-center">
            {widgets.map((widget) => (
                <div
                    key={widget.id}
                    className="group flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => onDragStart(e, widget.type, widget.src)}
                >
                    <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all shadow-sm">
                        <widget.icon className="text-slate-600 group-hover:text-blue-600" size={24} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{widget.label}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default MediaDock;