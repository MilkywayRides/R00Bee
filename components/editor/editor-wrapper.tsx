"use client";

import { useEffect, useRef, useCallback } from "react";
import EditorJS from "@editorjs/editor-js";

interface EditorProps {
  data?: any;
  onChange: (data: any) => void;
  holder: string;
  placeholder?: string;
}

export default function Editor({ 
  holder, 
  data, 
  onChange,
  placeholder 
}: EditorProps) {
  const editorRef = useRef<EditorJS>();
  const initialDataRef = useRef(data);

  const initEditor = useCallback(async () => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: {
          header: {
            class: (await import('@editorjs/header')).default,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3],
              defaultLevel: 1
            }
          },
          list: {
            class: (await import('@editorjs/list')).default,
            inlineToolbar: true,
          },
          image: {
            class: (await import('@editorjs/image')).default,
            config: {
              endpoints: {
                byFile: '/api/upload/image',
              },
            }
          },
          quote: {
            class: (await import('@editorjs/quote')).default,
          },
          code: {
            class: (await import('@editorjs/code')).default,
          },
          inlineCode: {
            class: (await import('@editorjs/inline-code')).default,
          },
          embed: {
            class: (await import('@editorjs/embed')).default,
          },
          table: {
            class: (await import('@editorjs/table')).default,
          },
          checklist: {
            class: (await import('@editorjs/checklist')).default,
          },
        },
        data: initialDataRef.current || {},
        placeholder,
        onChange: async () => {
          const content = await editor.save();
          onChange(content);
        },
        autofocus: true,
      });

      editorRef.current = editor;
    }
  }, [holder, onChange, placeholder]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      initEditor();
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = undefined;
      }
    };
  }, [initEditor]);

  return <div id={holder} className="prose prose-stone dark:prose-invert max-w-none" />;
}