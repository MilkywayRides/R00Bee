// components/ContentTab.tsx
"use client";

import { useState } from "react";
import EditorWrapper from "@/components/editor/editor-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Undo, Redo, Type, ListOrdered, Link, Image, Quote, Clock } from "lucide-react";

interface ContentTabProps {
  title: string;
  setTitle: (title: string) => void;
  excerpt: string;
  setExcerpt: (excerpt: string) => void;
  content: any;
  setContent: (content: any) => void;
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
  wordCount: number;
  setWordCount: (count: number) => void;
  autoSave: boolean;
  setAutoSave: (autoSave: boolean) => void;
  setUnsavedChanges: (changes: boolean) => void;
}

export function ContentTab({
  title,
  setTitle,
  excerpt,
  setExcerpt,
  content,
  setContent,
  previewMode,
  setPreviewMode,
  wordCount,
  setWordCount,
  autoSave,
  setAutoSave,
  setUnsavedChanges,
}: ContentTabProps) {
  const handleEditorChange = (data: any) => {
    setContent(data);
    setUnsavedChanges(true);
    const blocks = data.blocks || [];
    const textContent = blocks
      .filter((block: any) => block.type === "paragraph")
      .map((block: any) => block.data.text)
      .join(" ");
    const words = textContent.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };

  const renderPreviewContent = () => {
    if (!content.blocks) return null;
    return content.blocks.map((block: any, index: number) => {
      switch (block.type) {
        case "paragraph":
          return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
        case "header":
          const HeadingTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
          return <HeadingTag key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
        default:
          return null;
      }
    });
  };

  return (
    <div>
      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setUnsavedChanges(true);
        }}
        placeholder="Post title"
        className="text-2xl h-12 font-medium border-none shadow-none focus-visible:ring-0 px-0 mb-3"
      />
      <Textarea
        value={excerpt}
        onChange={(e) => {
          setExcerpt(e.target.value);
          setUnsavedChanges(true);
        }}
        placeholder="Write a brief excerpt or summary of your post (optional)"
        className="resize-none text-sm border-none shadow-none focus-visible:ring-0 px-0"
        rows={2}
      />

      <div className="flex items-center gap-1 mb-4 p-1 border rounded-md bg-muted/30 overflow-x-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Select defaultValue="paragraph">
          <SelectTrigger className="w-32 h-8 border-none bg-transparent focus:ring-0">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Type className="h-4 w-4 font-bold" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Type className="h-4 w-4 italic" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Link</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Image className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Image</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="border rounded-md p-4 min-h-[400px]">
        {!previewMode ? (
          <EditorWrapper
            onChange={handleEditorChange}
            data={content}
            placeholder="Start writing your post here..."
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <h1>{title || "Post Title"}</h1>
            {excerpt && <p className="text-muted-foreground">{excerpt}</p>}
            {renderPreviewContent()}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{wordCount} words</span>
          </div>
          <div>~{Math.ceil(wordCount / 200)} min read</div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} size="sm" />
          <Label htmlFor="auto-save" className="cursor-pointer">
            Auto-save
          </Label>
        </div>
      </div>
    </div>
  );
}
