/**
 * Example usage of RichTextEditor component
 * 
 * This is just an example file showing how to use the RichTextEditor.
 * You can delete this file after understanding the usage.
 */

'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RichTextEditorExample() {
  const [description, setDescription] = useState('');
  const [savedContent, setSavedContent] = useState('');

  const handleSave = () => {
    setSavedContent(description);
    alert('Content saved!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Rich Text Editor Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Usage */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter description here..."
              height={400}
            />
          </div>

          {/* With Custom Height */}
          <div>
            <label className="text-sm font-medium mb-2 block">Short Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter short description..."
              height={200}
              minHeight={150}
            />
          </div>

          {/* Readonly Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preview (Readonly)</label>
            <RichTextEditor
              value={savedContent}
              onChange={() => {}}
              placeholder="Preview content..."
              readonly={true}
              height={300}
            />
          </div>

          <Button onClick={handleSave} className="bg-brand-600 hover:bg-brand-700">
            Save Content
          </Button>

          {/* Display HTML Content */}
          {savedContent && (
            <div className="mt-4 p-4 border rounded-md">
              <h3 className="font-semibold mb-2">Saved HTML:</h3>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {savedContent}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

