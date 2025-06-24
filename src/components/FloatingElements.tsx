import React from 'react';
import { BookOpen, PenTool, FileText, Edit3, Feather } from 'lucide-react';

const FloatingElements = () => {
  const elements = [
    { icon: <BookOpen />, className: 'book', delay: 0 },
    { icon: <PenTool />, className: 'quill', delay: 2 },
    { icon: <FileText />, className: 'book', delay: 4 },
    { icon: <Edit3 />, className: 'quill', delay: 6 },
    { icon: <Feather />, className: 'quill', delay: 8 },
    { icon: <BookOpen />, className: 'book', delay: 10 },
    { text: 'Knowledge', className: 'word', delay: 1 },
    { text: 'Wisdom', className: 'word', delay: 3 },
    { text: 'Stories', className: 'word', delay: 5 },
    { text: 'Ideas', className: 'word', delay: 7 },
    { text: 'Insights', className: 'word', delay: 9 },
    { text: 'Expertise', className: 'word', delay: 11 },
  ];

  return (
    <div className="background-animation">
      {elements.map((element, index) => (
        <div
          key={index}
          className={`floating-element ${element.className}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${element.delay}s`,
          }}
        >
          {element.icon || element.text}
        </div>
      ))}
    </div>
  );
};

export default FloatingElements;